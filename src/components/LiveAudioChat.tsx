import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, X, Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { DiagnosisResult } from '../services/gemini';
import { OpenAIRealtimeVoice } from './OpenAIRealtimeVoice';

interface LiveAudioChatProps {
  diagnosis: DiagnosisResult | null;
  onClose: () => void;
  onListeningChange?: (isListening: boolean) => void;
}

const GeminiLiveAudioChat: React.FC<LiveAudioChatProps> = ({ diagnosis, onClose, onListeningChange }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMutedRef = useRef(isMuted);
  
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    let isMounted = true;

    const stopInputResources = () => {
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch (e) {}
        processorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      onListeningChange?.(false);
    };

    const showLiveError = (message: string) => {
      if (!isMounted) return;
      setError(message);
      setIsConnecting(false);
      setIsConnected(false);
      toast.error(message, { id: 'live-ai-status' });
    };

    const initLiveAPI = async () => {
      try {
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const isSecureOrigin = window.location.protocol === 'https:' || isLocalhost;
        if (!isSecureOrigin) {
          showLiveError('Live AI microphone access requires HTTPS. Please use HTTPS after deployment.');
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          showLiveError('Microphone access is not supported in this browser.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        onListeningChange?.(true);
        toast.success('Microphone connected. Connecting to AgroCare AI...', { id: 'live-ai-status' });

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;

        const queryParams = new URLSearchParams();
        if (diagnosis) {
          queryParams.append('crop', diagnosis.crop || '');
          queryParams.append('disease', diagnosis.disease || '');
          queryParams.append('severity', diagnosis.severity || '');
          queryParams.append('organic', diagnosis.treatment?.organic?.name || '');
          queryParams.append('chemical', diagnosis.treatment?.chemical?.name || '');
        }

        const ws = new WebSocket(`${wsUrl}?${queryParams.toString()}`);
        wsRef.current = ws;

        ws.onopen = async () => {
          if (!isMounted) return;
          setIsConnecting(false);
          setIsConnected(true);

          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMutedRef.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
              }
              
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true);
              }
              
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ audio: base64 }));
              }
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
          } catch (err) {
            console.error("Audio processing error:", err);
            stopInputResources();
            showLiveError("Microphone started, but audio processing failed. Please try again.");
            try {
              ws.close();
            } catch (e) {}
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;

          try {
            const message = JSON.parse(event.data);

            // Handle interruption
            if (message.interrupted) {
              activeSourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
              });
              activeSourcesRef.current = [];
              if (playbackContextRef.current) {
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }
              setIsSpeaking(false);
            }

            // Handle audio output
            if (message.audio) {
              setIsSpeaking(true);
              if (!playbackContextRef.current) {
                playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                nextPlayTimeRef.current = playbackContextRef.current.currentTime;
              }

              const ctx = playbackContextRef.current;
              
              const binaryString = atob(message.audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768;
              }

              const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              const playTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
              source.start(playTime);
              nextPlayTimeRef.current = playTime + audioBuffer.duration;
              
              activeSourcesRef.current.push(source);
              
              source.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                if (activeSourcesRef.current.length === 0) {
                  setIsSpeaking(false);
                }
              };
            }
          } catch (err) {
            console.error("Error parsing message from live-ws:", err);
          }
        };

        ws.onerror = (err) => {
          console.error("Live WebSocket Error:", err);
          showLiveError("Live AI connection failed. Please check the server and Gemini API key.");
        };

        ws.onclose = (event) => {
          stopInputResources();
          if (!isMounted) return;
          setIsConnected(false);
          setIsConnecting(false);

          if (event.code !== 1000) {
            const message = event.reason || "Live AI is unavailable right now. Please try again after the server is ready.";
            setError(prev => prev || message);
            toast.error(message, { id: 'live-ai-status' });
          }
        };

      } catch (err) {
        console.error("Failed to init Live API:", err);
        stopInputResources();
        if (isMounted) {
          let message = "Could not access microphone.";
          if (err instanceof DOMException) {
            if (err.name === 'NotAllowedError') {
              message = "Microphone permission denied. Please allow microphone access to use Live AI.";
            } else if (err.name === 'NotFoundError') {
              message = "No microphone was found on this device.";
            } else if (err.name === 'NotReadableError') {
              message = "Microphone is already in use by another app.";
            } else if (err.name === 'SecurityError') {
              message = "Microphone access is blocked by browser security settings.";
            }
          }
          showLiveError(message);
        }
      }
    };

    initLiveAPI();

    return () => {
      isMounted = false;
      stopInputResources();
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
        playbackContextRef.current.close().catch(console.error);
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
      }
    };
  }, [diagnosis, onListeningChange]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 pb-8 flex flex-col items-center text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
          >
            <X size={20} />
          </button>
          
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
            {isSpeaking && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-primary/20 rounded-full"
              />
            )}
            <Volume2 size={40} className={`text-primary ${isSpeaking ? 'animate-pulse' : ''}`} />
          </div>
          
          <h2 className="text-2xl font-black text-earth mb-2">AgroCare Voice</h2>
          
          {isConnecting ? (
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <Loader2 size={16} className="animate-spin" />
              Connecting to AI...
            </div>
          ) : error ? (
            <p className="text-red-500 font-medium">{error}</p>
          ) : (
            <p className="text-gray-600 font-medium">
              {isSpeaking ? "AI is speaking..." : "Listening... Ask about your crop."}
            </p>
          )}
        </div>
        
        <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
          <button
            onClick={() => setIsMuted(!isMuted)}
            disabled={isConnecting || !!error}
            className={`p-6 rounded-full shadow-lg transition-all ${
              isMuted 
                ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                : 'bg-primary text-white hover:bg-primary-dark'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Prefer the OpenAI WebRTC agent, but retain the proven Gemini Live path so a
 * farmer is never left without voice assistance when the realtime provider is unavailable.
 */
export const LiveAudioChat: React.FC<LiveAudioChatProps> = (props) => {
  const [useGeminiFallback, setUseGeminiFallback] = useState(false);

  if (useGeminiFallback) {
    return <GeminiLiveAudioChat {...props} />;
  }

  return <OpenAIRealtimeVoice {...props} onFallback={() => setUseGeminiFallback(true)} />;
};

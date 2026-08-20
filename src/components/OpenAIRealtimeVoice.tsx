import React, { useEffect, useRef, useState } from 'react';
import { CloudSun, Leaf, Loader2, Mic, MicOff, ShieldCheck, Volume2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { DiagnosisResult } from '../services/gemini';
import { apiFetch } from '../services/apiClient';

interface OpenAIRealtimeVoiceProps {
  diagnosis: DiagnosisResult | null;
  onClose: () => void;
  onListeningChange?: (isListening: boolean) => void;
  onFallback: () => void;
}

type VoiceToolName = 'get_weather' | 'search_itk' | 'get_crop_diagnosis' | 'find_supplier' | 'check_scheme';

const toolLabels: Record<VoiceToolName, string> = {
  get_weather: 'Checking weather safety',
  search_itk: 'Checking agricultural knowledge',
  get_crop_diagnosis: 'Reading crop diagnosis',
  find_supplier: 'Finding nearby suppliers',
  check_scheme: 'Checking scheme directory',
};

export const OpenAIRealtimeVoice: React.FC<OpenAIRealtimeVoiceProps> = ({
  diagnosis,
  onClose,
  onListeningChange,
  onFallback,
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    let isMounted = true;

    const cleanup = () => {
      onListeningChange?.(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      dataChannelRef.current?.close();
      dataChannelRef.current = null;
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
      }
    };

    const useGeminiFallback = (message: string) => {
      if (!isMounted || hasConnectedRef.current) return;
      cleanup();
      toast.info(`${message} Switching to Gemini voice.`, { id: 'voice-provider-status' });
      onFallback();
    };

    const sendRealtimeEvent = (event: Record<string, unknown>) => {
      if (dataChannelRef.current?.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify(event));
      }
    };

    const executeToolCall = async (event: any) => {
      const name = event.name as VoiceToolName;
      if (!Object.prototype.hasOwnProperty.call(toolLabels, name)) return;

      setToolActivity(toolLabels[name]);
      try {
        let args: Record<string, unknown> = {};
        if (event.arguments) args = JSON.parse(event.arguments);
        const response = await apiFetch('/api/voice/tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, arguments: args, diagnosis }),
        });
        const result = await response.json().catch(() => ({ error: 'Tool returned an invalid response' }));
        sendRealtimeEvent({
          type: 'conversation.item.create',
          item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify(result) },
        });
      } catch {
        sendRealtimeEvent({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: event.call_id,
            output: JSON.stringify({ error: 'AgroCare could not complete that tool request right now.' }),
          },
        });
      } finally {
        setToolActivity('Preparing recommendation');
        sendRealtimeEvent({ type: 'response.create' });
        window.setTimeout(() => isMounted && setToolActivity(null), 1800);
      }
    };

    const initialise = async () => {
      try {
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        if (window.location.protocol !== 'https:' && !isLocalhost) {
          throw new Error('Microphone access requires HTTPS after deployment.');
        }
        if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
          throw new Error('Realtime voice is not supported in this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        onListeningChange?.(true);
        const peerConnection = new RTCPeerConnection();
        peerConnectionRef.current = peerConnection;
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

        peerConnection.ontrack = (event) => {
          if (!audioRef.current) return;
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play().catch(() => undefined);
        };
        peerConnection.onconnectionstatechange = () => {
          if (!isMounted) return;
          if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
            setError('Voice connection was interrupted. You can continue with text chat.');
            setIsConnected(false);
          }
        };

        const dataChannel = peerConnection.createDataChannel('oai-events');
        dataChannelRef.current = dataChannel;
        dataChannel.onopen = () => {
          if (!isMounted) return;
          hasConnectedRef.current = true;
          setIsConnecting(false);
          setIsConnected(true);
          toast.success('AgroCare Voice is ready.', { id: 'voice-provider-status' });
        };
        dataChannel.onmessage = (messageEvent) => {
          try {
            const event = JSON.parse(messageEvent.data);
            if (event.type === 'input_audio_buffer.speech_started') {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              setIsSpeaking(false);
              setTranscript('');
            }
            if (event.type === 'response.output_audio.delta') setIsSpeaking(true);
            if (event.type === 'response.output_audio.done' || event.type === 'response.done') setIsSpeaking(false);
            if (event.type === 'response.output_audio_transcript.delta' && typeof event.delta === 'string') {
              setTranscript((previous) => `${previous}${event.delta}`.slice(-180));
            }
            if (event.type === 'response.function_call_arguments.done') void executeToolCall(event);
            if (event.type === 'error') {
              setError('Voice service reported an error. You can continue with text chat.');
              setIsSpeaking(false);
            }
          } catch {
            // Ignore malformed realtime events without interrupting the call.
          }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        const sessionResponse = await apiFetch('/api/voice/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sdp: peerConnection.localDescription?.sdp, diagnosis }),
        });

        if (!sessionResponse.ok) {
          useGeminiFallback('OpenAI voice is unavailable.');
          return;
        }

        const answerSdp = await sessionResponse.text();
        await peerConnection.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch (caught) {
        const message = caught instanceof DOMException && caught.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access to use AgroCare Voice.'
          : caught instanceof Error ? caught.message : 'Could not start realtime voice.';
        if (!hasConnectedRef.current) {
          useGeminiFallback(message);
          return;
        }
        setError(message);
        setIsConnecting(false);
      }
    };

    void initialise();
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [diagnosis, onFallback, onListeningChange]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 pb-7 flex flex-col items-center text-center relative">
          <button onClick={onClose} aria-label="Close voice agent" className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition">
            <X size={20} />
          </button>
          <audio ref={audioRef} autoPlay />
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-5 relative">
            {isSpeaking && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute inset-0 bg-primary/20 rounded-full" />}
            {isSpeaking ? <Volume2 size={40} className="text-primary animate-pulse" /> : <Mic size={40} className="text-primary" />}
          </div>
          <h2 className="text-2xl font-black text-earth mb-1">AgroCare Voice</h2>
          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">OpenAI Realtime • Secure WebRTC</p>
          {isConnecting ? (
            <div className="flex items-center gap-2 text-gray-500 font-medium"><Loader2 size={16} className="animate-spin" /> Connecting securely…</div>
          ) : error ? (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          ) : (
            <p className="text-gray-600 font-medium">{toolActivity || (isSpeaking ? 'Speaking… you can interrupt anytime.' : 'Listening… ask about your crop.')}</p>
          )}
          {transcript && <p className="mt-3 text-xs text-gray-500 line-clamp-2">{transcript}</p>}
        </div>

        <div className="px-5 pb-4 grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-500">
          <span className="flex items-center justify-center gap-1 rounded-lg bg-sky-50 py-2"><CloudSun size={13} /> Weather</span>
          <span className="flex items-center justify-center gap-1 rounded-lg bg-emerald-50 py-2"><Leaf size={13} /> Knowledge</span>
          <span className="flex items-center justify-center gap-1 rounded-lg bg-amber-50 py-2"><ShieldCheck size={13} /> Safety</span>
        </div>

        <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
          <button
            onClick={() => setIsMuted((muted) => !muted)}
            disabled={isConnecting || !!error || !isConnected}
            className={`p-6 rounded-full shadow-lg transition-all ${isMuted ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-primary text-white hover:bg-primary-dark'} disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

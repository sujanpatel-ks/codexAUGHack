# 🌾 AgroCare AI

### AI-Powered Multimodal Smart Farming Assistant

[![Build Status](https://img.shields.io/badge/Build-Success-success?style=flat-square)](https://github.com/spacecraftech1/agrocare-ai)
[![React Version](https://img.shields.io/badge/React-18/19-blue?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Gemini API](https://img.shields.io/badge/Powered%20By-Google%20Gemini-orange?style=flat-square)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind--4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📖 Overview

Agriculture is the backbone of the global economy, yet smallholder farmers in developing regions face significant challenges, including crop diseases, unpredictable weather, volatile market prices, and a lack of real-time expert guidance. Furthermore, tech literacy, language barriers, and spotty internet connectivity often prevent these farmers from accessing modern digital agricultural tools.

**AgroCare AI** is an advanced, production-ready, mobile-first web application designed to bridge this accessibility gap. By utilizing Google's state-of-the-art multimodal Gemini models alongside on-device localized failovers, AgroCare AI provides farmers with:
1. **Multimodal Crop Pathology**: Real-time leaf disease scanning with computer vision.
2. **Real-time Bidirectional Audio Dialogue**: Direct voice-based agricultural guidance powered by low-latency audio streaming.
3. **Mandi Arbitrage & Market Intelligence**: Precise, localized Indian market rates coupled with geographic arbitrage mapping.
4. **Resilient Local-First Failover (Gemma Edge AI)**: Zero-connectivity operations powered by an on-device rules engine loaded with official ICAR ITK database models.

---

## ⚠️ Problem Statement
### ### **Real-Time Multimodal Interaction**

Smallholder farmers encounter severe operational limitations daily:
- **Lack of Timely Diagnostics**: Crop disease can ruin up to 80% of a harvest before an expert can visit the site.
- **Volatile Crop Pricing**: Intermediaries exploit market information asymmetry, keeping farmers from realizing the true value of their yield.
- **Varying Tech Literacy & Language Barriers**: Most advanced farm management apps are written in English and rely heavily on complex text menus.
- **Unreliable Network Infrastructure**: Remote rural regions suffer from unstable cellular data, causing cloud-only systems to crash exactly when needed.

---

## 💡 The Solution: AgroCare AI

AgroCare AI introduces an inclusive, multimodal ecosystem designed for resilience and accessibility:
- **Low-Barrier Interfaces**: Integrating voice inputs and spoken outputs (Text-to-Speech) so literacy is never a prerequisite.
- **Multilingual Native Execution**: The entire interface and all AI advisories can be instantly toggled between **English**, **Hindi (हिन्दी)**, and **Kannada (ಕನ್ನಡ)**.
- **Secured Grounded Services**: Combining real government mandi APIs with Google Search and Maps Grounding to produce highly accurate, reliable, hallucination-free agricultural intelligence.
- **Seamless Local Failover**: A smart Model Router that automatically transitions to **Gemma Local-First Edge AI** during network dropouts or API quota exhausts, safeguarding core farming operations.

---

## ✨ Key Features

### 🔍 1. AI Crop Disease Scanner
* **Multimodal Leaf Pathology**: Snap or upload photos of diseased crop leaves. The application uses specialized multimodal vision prompts to perform an on-screen leaf quality audit before confirming any diagnosis.
* **Granular Action Plans**: Receives a confidence score, bounding boxes for infected tissue, specific symptom match percentages, and structured treatment guidelines divided into **Organic** and **Chemical** methodologies (including dosage, estimated costs, and crop recovery advice).

### 🎙️ 2. Real-Time Voice Agent (`LiveAudioChat`)
* **OpenAI WebRTC Voice Agent**: Farmers can have a low-latency, bidirectional conversation with AgroCare Voice through a server-authenticated `gpt-realtime` WebRTC call. The browser never receives the OpenAI API key.
* **Actionable Tool Use**: The agent can call backend weather safety, diagnosis-context, ITK knowledge, supplier, and scheme-directory tools. Tool activity appears only when a real tool call occurs.
* **Resilient Fallback**: If OpenAI Realtime is unavailable, the existing Gemini Live WebSocket voice path starts automatically so farmers can continue speaking to AgroCare.

### 📈 3. Mandi Price Arbitrage Analyzer
* **Government Market API Proxy**: Fetches real-time, daily commodity rates directly from Indian mandi networks (data.gov.in), prioritizing Karnataka (Tumkur) with automated national fallback buffers.
* **Haversine Distance Mapping**: Integrates the Geolocation API to find the user's distance to multiple active mandis across India, calculating transportation costs vs. market price gaps to show the exact **Arbitrage Profit Margin** of where to sell their crops.

### 🧪 4. Soil Health Analysis
* **NPK & pH Diagnostics**: Input simple soil test results (Nitrogen, Phosphorus, Potassium, pH, Moisture, Soil Type) to receive a comprehensive chemical composition assessment.
* **Custom Fertilizer Prescriptions**: Outputs highly localized fertilizer mixtures, dosage per acre, application frequency, and suitable crop recommendations.

### 📡 5. Geolocation-Based Suppliers & Weather
* **Google Maps Grounding**: Automatically detects seed stores, fertilizer shops, and agricultural input distributors within a 25km radius of the farmer's coordinates.
* **Google Search-Grounded Weather**: Delivers a 5-day agricultural weather forecast (temp, rain probability, wind, humidity) containing custom field-level advice (e.g., *"Delay pesticide spraying as rain is expected in 4 hours"*).

### 🛡️ 6. Zero-Connectivity Failover (Gemma Edge AI)
* **Model Router**: A global internet connectivity monitor. If cellular reception drops or Gemini Cloud rate limits are hit, the chat system seamlessly fails over to **Gemma Edge AI**.
* **ICAR ITK-Knowledge Base**: Loaded with official Indigenous Technical Knowledge (ITK) guidelines curated by the Indian Council of Agricultural Research (ICAR). Provides offline remedies for pests (e.g., *Neemastra, Aloe Vera barriers*) and livestock ailments (e.g., *cattle Mastitis alum-honey cures*).

### 👥 7. Community Hub & Schemes
* **Farmers Forum**: A peer-to-peer discussions dashboard supporting posts, tag classifications (e.g., `#Disease`, `#Fertilizer`), and real-time client-side searching.
* **Subsidies & Schemes Portal**: Instantly searches active government schemes and agricultural subsidies tailored to the farmer's crops.

---

## 📽️ Demo

* 🌐 **Live Web Application**: [https://ais-pre-3z5d4o2iwum7xjsn42vgqh-72897400089.asia-east1.run.app](https://ais-pre-3z5d4o2iwum7xjsn42vgqh-72897400089.asia-east1.run.app)
* 🎥 **Hackathon Demonstration Video**: `[Insert Demo Video Link]`

---

## 📸 Screenshots

| 📱 Home Dashboard | 🔍 Leaf Diagnosis | 🎙️ Live Voice Chat |
| :---: | :---: | :---: |
| *Real-time weather, market trends, and quick action banners.* | *Multimodal computer vision scanning potato early blight.* | *Hands-free WebSocket voice interaction with Zephyr.* |

---

## 🛠️ Technology Stack

| Component | Technology | Detail |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS 4.0 | Single-page architecture, responsive mobile-first grid, high-contrast UI. |
| **Animations**| Framer Motion (`motion/react`) | Smooth fluid transitions, tactile button interactions, live audio ripples. |
| **Backend** | Node.js, Express, `ws` (WebSockets) | Static asset distribution, secure API proxies, high-concurrency audio routing. |
| **Database** | Cloud Firestore, Firebase Auth, `better-sqlite3` | Unified session management, secure profile writing, localized file stores. |
| **AI Processing**| OpenAI Realtime API + Google Gen AI SDK (`@google/genai`) | Server-authenticated WebRTC voice agent, plus Gemini vision, TTS, grounding, and voice fallback. |
| **APIs Used** | Geolocation API, Web Audio API, Web Speech API | Captures coordinates, records raw microphone PCM, decodes sound buffers. |

---

## 🤖 Google AI Technologies Used

### 🟢 Google Gemini Multimodal APIs
1. **`gemini-3.5-flash` (Pathology & Grounding)**:
   * **Pathology**: Processes crop photos, analyzing leaf surfaces against rigid diagnostic instructions to output schema-compliant JSON.
   * **Weather Advice**: Grounded with Google Search to return real-time local conditions combined with custom farming-specific action items.
   * **Nearby Suppliers**: Bound with Google Maps Grounding to return physical locations and ratings for surrounding agricultural retail outlets.
2. **`gemini-3.1-flash-live-preview` (Real-Time Voice)**:
   * Initiates bidirectional, low-latency WebSocket connections via Express. Streams farmer voice commands directly to the live auditory model and receives back raw audio responses in the "Zephyr" voice.
3. **`gemini-2.5-flash-preview-tts` (Accessible Text-to-Speech)**:
   * Decodes diagnostic text into rich synthesized spoken audio to support farmers with varying reading comprehension skills.

### 🟢 OpenAI Realtime Voice
* **`gpt-realtime` (Primary Voice Agent)**: The server exchanges the browser's WebRTC SDP offer with OpenAI and returns only the SDP answer. `OPENAI_API_KEY` stays server-side.
* **Tool guardrails**: Weather safety is evaluated deterministically by the AgroCare backend; the model cannot override an unsafe or unknown spray recommendation.

### 🟢 Firebase Integration
* **Firebase Authentication**: Implements secure user creation and profile state tracking.
* **Cloud Firestore**: Holds persistent profiles (`/users`) and diagnosis histories (`/diagnoses`) protected by granular Firebase Security Rules.

---

## 🏗️ System Architecture

```text
                               +-----------------------------------+
                               |            User Browser           |
                               | (React 18, Tailwind, Framer-Motion)|
                               +-----------------+-----------------+
                                                 |
                       HTTPS Requests            |    Bidirectional WebSockets
                       & Assets Serving          |    (Audio PCM 16kHz)
                                                 v
                               +-----------------+-----------------+
                               |       Express Backend (Cloud Run)  |
                               +--------+-----------------+--------+
                                        |                 |
                   DB Writes / Auth     |                 |  Orchestrated
                                        v                 |  Direct SDK Calls
                               +--------+--------+        |
                               |  Firebase Suite |        |
                               |  - Auth         |        |
                               |  - Firestore    |        |
                               +-----------------+        v
                                                 +--------+--------+
                                                 |  Gemini APIs    |
                                                 |  (@google/genai)|
                                                 +---+----+----+---+
                                                     |    |    |
                      +------------------------------+    |    +-----------------------------+
                      |                                   |                                  |
                      v                                   v                                  v
         +------------+------------+         +------------+------------+         +------------+------------+
         |     Multimodal Vision   |         |      Live Voice API     |         |     Grounding Services  |
         |    (gemini-3.5-flash)   |         | (gemini-3.1-flash-live) |         | - Google Search         |
         |    - Leaf pathology     |         | - Low-latency streaming |         | - Google Maps           |
         +-------------------------+         +-------------------------+         +-------------------------+
```

---

## 🔄 Application Workflows

### A. The Diagnostic Pipeline (Camera Mode)
1. **User Action**: The farmer launches the Crop Disease Scanner, selects a camera feed, and captures a photo of a diseased leaf.
2. **Quality Audit**: The image is compressed into a Base64 string. The React client calls our secure backend API (`/api/diagnose`).
3. **Inference & Rules Checking**: The backend sends the payload to `gemini-3.5-flash` with strict diagnostic rules. Gemini checks if the image is too blurry, dark, or contains multiple leaves.
4. **JSON Structuring**: If the audit passes, Gemini parses the leaf, calculates a confidence percentage using the **4-Factor Method**, compiles treatments (Organic & Chemical), and structures the response into valid JSON.
5. **Interactive UI Update**: React receives the structured JSON, rendering the coordinates on the canvas and updating the diagnosis dashboard.

### B. The Conversational Audio Pipeline (Gemini Live API)
1. **Initiation**: The user clicks the **Talk to AI** microphone button.
2. **WebSocket Handshake**: React opens a WebSocket connection to the backend proxy at `/api/live-ws`, appending the crop diagnostic state as metadata.
3. **Microphone Capture**: The browser starts recording via `navigator.mediaDevices.getUserMedia`. A `ScriptProcessorNode` extracts the stream at 16kHz, converts float samples into raw 16-bit signed PCM integers, and pushes Base64 audio blocks to the backend.
4. **Inference & Audio Generation**: The Express server streams these PCM packets directly to `gemini-3.1-flash-live-preview`. The Live API processes the auditory inputs, incorporating the diagnostic metadata into its system instructions.
5. **Low-Latency Playback**: As the model synthesizes speech, the server relays the audio chunks back to the client. The frontend decodes the packets using `AudioContext` and plays them seamlessly through the user's speakers.

---

## 💻 Installation & Local Development

### Prerequisites
- **Node.js** v18 or newer
- **npm** (comes with Node)
- **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))
- **OpenAI API Key** for the primary realtime voice agent (Gemini Live remains the fallback)
- **Firebase Project Credentials** (Optional, falls back safely to in-memory databases if unconfigured)

### Step 1: Clone the Repository
```bash
git clone https://github.com/spacecraftech1/agrocare-ai.git
cd agrocare-ai
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Google Gemini API key (Required for server-side processing)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI Realtime key (server-side only; never use a VITE_ prefix)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_MODEL=gpt-realtime

# Government Mandi Price API key (Optional fallback key included)
VITE_DATA_GOV_IN_API_KEY=your_government_data_api_key

# Google Maps/Places API key for supplier rendering
VITE_GOOGLE_PLACES_API_KEY=your_google_maps_api_key
```

### Step 4: Run the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### Step 5: Build for Production
To bundle the frontend assets and compile the TypeScript backend Express server into a standalone CJS package:
```bash
npm run build
```
Start the production container server:
```bash
npm run start
```

---

## 📂 Project Structure

```text
agrocare-ai/
├── server.ts                  # Express Backend & WebSocket Server (Cloud Run entry)
├── vite.config.ts             # Vite build configuration (Tailwind & React plugins)
├── tsconfig.json              # TypeScript compilation specifications
├── package.json               # Package dependencies & scripts
├── firebase-blueprint.json    # Firestore initial schema blueprints
├── firestore.rules            # Firestore security rules
├── src/                       # Frontend Source Directory
│   ├── main.tsx               # Client entry point
│   ├── App.tsx                # SPA state manager & layout engine
│   ├── AuthProvider.tsx       # Firebase Authentication Context
│   ├── types.ts               # Shared TypeScript schemas, interfaces, & enums
│   ├── constants.ts           # Unified farming constants & diagnostic lists
│   ├── i18n.ts                # Internationalization config (EN, HI, KN)
│   ├── index.css              # Global styles & Tailwind CSS imports
│   ├── components/            # Interactive UI Components
│   │   ├── CameraDiagnosis.tsx   # Leaf photography controller
│   │   ├── LiveAudioChat.tsx     # OpenAI voice-agent wrapper with Gemini fallback
│   │   ├── OpenAIRealtimeVoice.tsx # WebRTC audio + realtime tool-call bridge
│   │   ├── ArbitrageAnalyzer.tsx # Localized mandi distance & profit calculator
│   │   ├── Market.tsx            # Mandi price list and API loader
│   │   ├── WeatherForecast.tsx   # Google Search weather advisory cards
│   │   ├── SoilAnalysis.tsx      # Soil health calculator
│   │   ├── SchemeFinder.tsx      # Subsidy and grants registry
│   │   └── Community.tsx         # Farmers forum bulletin
│   ├── services/              # API Integration Services
│   │   ├── connectivity.ts       # Internet availability monitor
│   │   ├── gemini.ts             # Direct Vision, TTS, Search, and Maps adapters
│   │   ├── gemma.ts              # Model Router & Local Offline Edge AI (Gemma-2B)
│   │   ├── marketApi.ts          # Government price client proxy
│   │   └── weatherService.ts     # Location-based forecast fetcher
│   ├── data/                  # Offline Fallback Databases
│   │   ├── itk-knowledge.ts      # ICAR Indigenous Technical Knowledge Database
│   │   ├── mandi-data.json       # Indian commodity rates fallback database
│   │   └── market_data.json      # High-density regional crop price index
│   └── locales/               # Static Localization Files
│       ├── en/                   # English catalog
│       ├── hi/                   # Hindi catalog
│       └── kn/                   # Kannada catalog
```

---

## ♿ Accessibility & Inclusivity

* **Multilingual Seamlessness**: The app's localization is handled entirely through `i18next`, matching UI languages with model prompts. Swapping languages changes both the user interface and the AI prompts.
* **Low-Literacy Design Pattern**: Every primary card features an interactive voice synthesis button. If a farmer has difficulty reading advice or complex chemical guidelines, they can simply tap "Listen" to hear Gemini read it aloud in their preferred dialect.
* **Tactile Visual Layout**: Employs earthy, natural colors (`bg-soil`, `text-earth`) and intuitive vector iconography from Lucide React to create an instant sense of trust and ease-of-use.

---

## 🚀 Future Roadmap

* [ ] **On-Device Local WebAssembly Inference**: Embed a compressed, optimized 2-billion parameter Gemma model directly in the browser using MediaPipe WebAssembly. This allows fully interactive local text generation with zero network hops.
* [ ] **Progressive Web App (PWA) Offline Isolation**: Package the app with custom service workers and cache policies, enabling farmers to boot up, view diagnostic history, and consult Gemma offline without ever opening a cell network.
* [ ] **IoT Soil Probe Synchronization**: Integrate Bluetooth Web API structures to receive NPK, moisture, and pH values directly from hardware soil sensors, removing manual data entry entirely.

---

## 🤝 Contributing

We welcome contributions to expand AgroCare AI's accessibility and reach:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add amazing feature'`.
4. Push to branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request detailing your enhancements.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

* **Sujan Technologies / Team AgroCare**
* 📧 Email: spacecraftech1@gmail.com
* 💻 GitHub: [@spacecraftech1](https://github.com/spacecraftech1)

---

## 💖 Acknowledgements

* **Google DeepMind AI Hackathon 2026** for providing the inspiration and evaluation space.
* **Indian Council of Agricultural Research (ICAR)** for curate and open-sourcing the invaluable Indigenous Technical Knowledge (ITK) database.
* **Ministry of Electronics & Information Technology (MeitY)** for exposing Indian mandi price indices via data.gov.in.
* **The Google Gemini Team** for publishing the ultra-low latency Gemini Live WebSockets API, enabling the next generation of voice-based accessibility.
* **OpenAI** for the Realtime API powering AgroCare Voice's WebRTC agent and tool-calling flow.

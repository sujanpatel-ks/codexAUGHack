# 🌾 AgroCare AI: Technical Project Documentation & System Manual

## 1. Executive Summary & Core Mission
**AgroCare AI** is a fully integrated, full-stack, mobile-first smart farming ecosystem designed to bridge the technology and accessibility gap for smallholder farmers. The platform provides localized, reliable, and highly interactive agricultural intelligence directly in hands-on environments.

By combining Google’s state-of-the-art multimodal Gemini models with real-world Indian government data indices, localized soil diagnostics, on-device edge failovers, and an interactive developer playground, AgroCare AI transforms complex agricultural scientific knowledge into intuitive, voice-enabled, offline-resilient, and localized actionable insights.

### Human-Centered Solutions for Rural Realities:
* **Illiteracy & Accessibility Barriers**: Overcome through real-time bidirectional voice dialogues and instantaneous text-to-speech (TTS) outputs.
* **Severe Network Instability**: Solved via an automated Model Router that detects connectivity failures and transitions to an offline-first Edge AI knowledge base sourced from the **Indian Council of Agricultural Research (ICAR)**.
* **Information Asymmetry**: Solved by calculating real-world transport costs vs. regional mandi prices to reveal geographic arbitrage and direct profit-maximizing sale channels.

---

## 2. Visual Identity & User Experience (UX) Design
AgroCare AI utilizes a custom, high-contrast, tactile theme engineered specifically to match the farming context while maintaining accessibility standards.

### A. Color Psychology & Theme (Earthy Harvest)
* **Soil Dark Canvas (`#0B0D0A`)**: A deep, neutral soil-toned background that minimizes eye strain in bright daylight and low-lit outdoor farming settings.
* **Leaf Green Accent (`#10B981` / `#059669`)**: Used to highlight active states, healthy diagnostics, and primary navigational paths, symbolizing growth and vitality.
* **Mandi Gold (`#F59E0B` / `#D97706`)**: Highlights prices, transaction metrics, and commercial opportunities, reflecting crop harvest and marketplace values.
* **Symptom Coral (`#EF4444` / `#DC2626`)**: Used exclusively for critical crop diseases, high infestations, and active alerts.

### B. Font Selection Strategy
The typography is imported directly into the global CSS engine, striking a balance between tech-forward aesthetics and precise legibility:
1. **Primary UI Typography - Inter**: A clean, highly legible, modern sans-serif utilized across all menus, forms, and general body texts.
2. **Display Typography - Space Grotesk**: A geometric, tech-forward sans-serif font reserved for high-impact titles, disease headings, and main dashboard stats.
3. **Technical Data - JetBrains Mono**: A pristine monospaced typeface dedicated to market rates, coordinate data, soil NPK ratios, and the integrated Android source code views.

### C. Motion & Interactive Choreography
Powered by `framer-motion` (imported from `motion/react`), the user interface provides a sense of physical weight and natural responsiveness:
* **Micro-Interactions**: All primary cards and action items respond with standard scaling (`whileTap={{ scale: 0.98 }}`) and smooth hover transformations.
* **Staggered Entrances**: Core dashboard items enter with vertical slide-ins and staggered opacities, avoiding overwhelming visual updates.
* **Dynamic Audio Waves**: When the Live Voice Chat is activated, the button morphs into an animated SVG ripple pattern that dynamically pulses with the input voice frequency.

---

## 3. Core Modules & Step-by-Step Workflows

### 🔍 A. Multimodal Crop Disease Scanner
The disease scanner processes plant pathology queries using computer vision and returns structured diagnostics with immediate action items.

```text
+-------------------+      Base64       +-------------------------+      JSON      +--------------------+
| Camera / File     | ----------------> | Express Backend Proxy   | -------------> | gemini-3.5-flash   |
| Capture           |                   | (/api/diagnose)         |                | Multimodal Vision  |
+-------------------+                   +-------------------------+                +---------+----------|
                                                                                             |
                                                                                             | Analyzes leaf,
                                                                                             | runs audit
                                                                                             v
+-------------------+                   +-------------------------+                +---------+----------+
| Render Diagnostic | <---------------- | Client React UI parses  | <------------- | Structured JSON    |
| Tabs & Overlay    |                   | treatment tracks        |                | Output Schema      |
+-------------------+                   +-------------------------+                +--------------------+
```

#### Detailed Workflow Mechanics:
1. **Capture & Compression**: The farmer uses their device camera to capture a leaf photo or uploads a file via the drag-and-drop zone in `CameraDiagnosis.tsx`.
2. **Quality Verification Prompt**: The image is formatted as a Base64 string and sent to the server-side `/api/diagnose` route. The prompt directs the `gemini-3.5-flash` model to perform a quality audit first:
   * It checks for image focus, high-blur, poor lighting, or missing foliage.
   * If the quality audit fails, it returns a friendly structural error instructing the user on how to take a better picture.
3. **4-Factor Severity Assessment**: If passed, Gemini analyzes the visual anomalies of the leaf (spotting, lesions, discoloration) against known agronomic datasets. It assesses severity based on:
   * **Infection Coverage**: Percentage of leaf surface showing symptoms.
   * **Distribution**: Scattered vs. localized spots.
   * **Tissue Necrosis**: Degree of cell death.
   * **Propagation Rate**: Typical transmission speed of the identified pathogen.
4. **Bifurcated Action Plans**: The model compiles treatment methodologies split into:
   * **Organic Methodologies**: Zero-chemical organic solutions (e.g., neem oil sprays, wood ash dusting), detailing preparation, dosage, and application times.
   * **Chemical Prescriptions**: Specific chemical fungicides/pesticides, complete with precise application ratios per acre, active ingredients, estimated local retail costs, and safety precautions.

---

### 🎙️ B. Real-Time Bidirectional Live Voice Dialogue (`LiveAudioChat`)
This module enables low-latency, hands-free conversation with the agronomic assistant. It bypasses standard text waiting loops to deliver speech-to-speech interaction.

```text
+--------------------+        16kHz signed 16-bit PCM         +---------------------------+
| Farmer Microphone  | --------------------------------------> | Express WebSocket Server  |
| (Web Audio API)    |                                         | (/api/live-ws)            |
+--------------------+                                         +-------------+-------------+
                                                                             |
                                                                             | Proxy Stream
                                                                             v
+--------------------+        Low-Latency Audio Buffers        +-------------+-------------+
| Browser Speakers   | <-------------------------------------- | gemini-3.1-flash-live-    |
| (AudioContext)     |                                         | preview (Live API)        |
+--------------------+                                         +---------------------------+
```

#### Detailed Voice Subsystem Mechanics:
1. **Audio Capture Loop**: When the farmer enters the Voice Session, the client requests microphone access via `navigator.mediaDevices.getUserMedia`.
2. **Client-Side Downsampling**:
   * An HTML5 `AudioContext` is spawned, and a `ScriptProcessorNode` (or `AudioWorklet`) intercepts incoming floating-point audio data.
   * The client downsamples the source frequency down to a standardized **16kHz, single-channel (mono), signed 16-bit PCM buffer**.
   * It packages these binary PCM buffers into Base64-encoded strings.
3. **WebSocket Tunneling**:
   * The client initiates a secure WebSocket handshake with the backend Express server at `/api/live-ws`.
   * This connection is proxied directly to the Google Gemini Live API endpoint (`gemini-3.1-flash-live-preview`).
   * The client feeds the real-time audio chunks continuously.
4. **Context Injection**: During initiation, the client injects any active crop diagnostics or regional weather variables into the WebSocket's initial configuration message. This ensures the live voice model maintains precise context of the user's active farm issues without needing manual voice explanations.
5. **Dynamic Playback Loop**:
   * The Gemini Live API synthesizes responses on the fly and streams back 24kHz PCM audio chunks.
   * The Express server pipes these packets down to the client.
   * The client pushes these chunks into a high-performance circular audio buffer.
   * It schedules playback consecutively via `AudioContext.decodeAudioData` (or direct PCM playback nodes), delivering a natural verbal response in the high-fidelity "Zephyr" voice with minimal latency.

---

### 📈 C. Mandi Price Arbitrage Analyzer
The market analyzer reads Indian commodity rates and applies geographic math to guide farmers to the most profitable physical marketplaces.

```text
[Farmer Location (GPS)] ---> Fetches coordinates (Lat, Lon)
                                    |
                                    v
[Government Mandi API] ----> Compiles active wholesale prices across multi-mandi networks
                                    |
                                    v
[Haversine Math Engine] ---> Computes geodesic distances to all physical markets
                                    |
                                    v
[Arbitrage Margins] --------> Displays: Market Rate - (Distance * Fuel/Transport Cost)
                              = Net Revenue-Optimized Marketplace Recommendations
```

#### Analytical Workflows:
1. **API Integration**: The application requests real-time agricultural mandi index feeds directly from India's open government data APIs (`data.gov.in`), prioritizing active state-level channels like APMC Karnataka.
2. **Haversine Distance Mapping**:
   * The user's device provides latitude and longitude coordinates through the Geolocation API.
   * The system parses the coordinates of surrounding wholesale markets (mandis) from its spatial index.
   * It executes the **Haversine Formula** to compute the precise geodesic distance (in kilometers) between the farmer and each mandi:
     $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
     *Where $R$ is the Earth's radius (6371 km), $\phi$ is latitude, and $\lambda$ is longitude.*
3. **Transportation Cost Offsetting**: The analyzer applies a standardized logistical overhead coefficient (e.g., ₹10 per kilometer per ton) to compute the actual transport cost of hauling crop yields to each location.
4. **Net Arbitrage Margin Visualization**: It calculates the net profit margin for each mandi:
   $$\text{Net Profit Margin} = \text{Mandi Market Rate} - \text{Calculated Transport Overhead}$$
   The results are listed in descending order, guiding the farmer to the maximum revenue-generating market.

---

### 📡 D. Geolocation-Based Weather & Suppliers
This module leverages browser capabilities combined with Google's grounded AI services to deliver hyper-localized intelligence.

* **Google Search-Grounded Weather**: The client fetches the user's coordinates and triggers the server-side Gemini search grounding system. This retrieves real-time weather reports and synthesizes 5-day forecasts with agricultural warnings (e.g., *"Heavy rain expected tomorrow at 2:00 PM; reschedule urea application to prevent soil leaching"*).
* **Google Maps-Grounded Suppliers**: Leverages location boundaries to query local seeds, pesticides, and organic fertilizer suppliers. The AI formats these grounded coordinates, ratings, and distances into a visual card-based locator panel.

---

## 4. Architectural Resilience: Zero-Connectivity Failover
To operate reliably in remote rural areas with poor connectivity, AgroCare AI includes a robust offline fallback mode.

```text
                          +------------------------+
                          |   Action Triggered     |
                          +-----------+------------+
                                      |
                           Is Internet Available?
                                     / \
                                    /   \
                             YES   /     \   NO
                                  /       \
                                 v         v
                     +------------------+  +------------------------+
                     | Cloud Gemini API |  | Model Router (Offline) |
                     | (High Fidelity)  |  +-----------+------------+
                     +------------------+              |
                                                       v
                                           +------------------------+
                                           | Local Edge Rules Engine|
                                           | - ICAR ITK Databases   |
                                           | - Local SQLite Stores  |
                                           +------------------------+
```

### The Offline Resiliency Loop:
1. **Model Router (`connectivity.ts`)**: The application runs a background ping loop monitor.
2. **Graceful Fallback**: If internet connection is lost or Gemini API keys face temporary rate throttling, the router shifts core chat queries away from the cloud.
3. **Indigenous Technical Knowledge (ITK) Engine**:
   * The offline fallback accesses a database of official guidelines compiled by the **Indian Council of Agricultural Research (ICAR)**.
   * It serves verified traditional formulas (such as *Neemastra*, *Dashaparni Arka*, and herbal treatments for livestock/poultry) based on matched keywords.
   * This provides functional continuity, ensuring farmers are never left without essential diagnostic support.

---

## 5. Technology Stack Deep Dive

The platform's features are powered by a modern, high-performance web development stack:

| Operational Layer | Technology | Component Detail & Usage |
| :--- | :--- | :--- |
| **User Interface** | React 18 & TypeScript | Single-page architecture, type-safe state routing, functional hook hooks, custom layout boundaries. |
| **Styling & Theme**| Tailwind CSS | Mobile-first grid layouts, responsive padding scales, high-contrast Earthy dark theme classes. |
| **Animations** | Framer Motion | Smooth transitions between dashboard modules, dynamic voice wave ripples, tactile button feedback. |
| **Backend Core** | Node.js & Express | Handles static assets, hosts secure API proxies, manages WebSockets, and compiles server bundles. |
| **Real-Time Audio** | WebSockets (`ws`) | Streams binary 16kHz signed 16-bit PCM voice packets to the live model with low latency. |
| **AI Systems** | Google Gen AI SDK | Unified client integration: `gemini-3.5-flash` (vision/grounding) and `gemini-3.1-flash-live` (voice). |
| **Cloud Databases**| Cloud Firestore NoSQL | Stores authenticated farmer profiles, regional settings, and diagnostic history. |
| **Local Databases**| `better-sqlite3` | Used for persistent server-side caching and offline diagnostic backups. |
| **Security** | Firebase Auth & Rules | Provides secure Google authentication, restricting data access to authorized owners. |

---

## 6. Android Kotlin Studio Workspace
The workspace features an integrated developer workbench, showcasing the platform's multi-platform capabilities.

```text
+--------------------------------------------------------------+
| Android Kotlin Studio Workspace                              |
+------------------------------------+-------------------------+
| Kotlin File Tree Explorer          | Interactive Emulator    |
| - MainActivity.kt                  | - Native UI Render      |
| - CropDiagnosisView.kt             | - Material 3 Layout     |
| - AudioRecorder.kt                 | - Simulated App Loop    |
| - HaversineCalculator.kt           |                         |
+------------------------------------+-------------------------+
| Source Code Viewer & Synth Highlighter                       |
| (Interactive, styled monospaced text rendering)              |
+--------------------------------------------------------------+
```

### Workspace Features:
* **Jetpack Compose Showcase**: Displays a clean, native Kotlin codebase matching the web application's design principles.
* **Interactive Code View**: Implements a custom syntactic parser that highlights comments, class imports, control structures (`fun`, `val`, `suspend`), and annotation statements (`@Composable`, `@SideEffect`).
* **Visual Device Simulator**: A simulated Android container renders the functional layouts of the Kotlin code, letting developers interact with buttons, list components, and camera previews on an interactive mobile shell.

---

## 7. Installation & Local Development Guide

Follow these steps to run the complete AgroCare AI platform locally.

### Prerequisites
* **Node.js** v18 or newer installed on your machine.
* A **Google Gemini API Key** (obtainable from [Google AI Studio](https://aistudio.google.com/)).
* An active terminal with terminal execution permissions.

### Step 1: Clone the Repository
```bash
git clone https://github.com/spacecraftech1/agrocare-ai.git
cd agrocare-ai
```

### Step 2: Install Package Dependencies
Install all required npm packages configured in `package.json`:
```bash
npm install
```

### Step 3: Set Up Environment Configuration
Create a `.env` file in the root directory:
```bash
cat <<EOT >> .env
# Required Server API Key (Never expose this key to client bundles)
GEMINI_API_KEY=your_google_gemini_api_key_here

# Optional: Indian Government open data token
VITE_DATA_GOV_IN_API_KEY=your_data_gov_in_api_token

# Optional: Google places API key
VITE_GOOGLE_PLACES_API_KEY=your_maps_places_key
EOT
```

### Step 4: Launch the Development Server
Start the local full-stack server running Express and Vite:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Step 5: Compile & Build for Production
To bundle the frontend single-page application and compile the backend TypeScript Express server into a standalone, optimized CJS package (`dist/server.cjs`):
```bash
npm run build
```

To run the production-ready server bundle:
```bash
npm run start
```

---

## 8. Summary of Engineering Achievements
* **Zero-Latency Ingress**: Direct binary PCM sound recording downsampled client-side to 16kHz for low-overhead network transfers.
* **Type-Safe Spatial Intelligence**: High-precision Haversine math calculating multi-mandi commercial options with physical route metrics.
* **Multi-Lingual Localization**: Instant interface and model prompt translation across English, Hindi, and Kannada.
* **Edge Resiliency**: Robust offline failover supporting core farming operations even in complete network blackouts.

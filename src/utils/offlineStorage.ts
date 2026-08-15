// Offline Storage and Persistence Engine for AgroCare AI
import { DiagnosisResult } from '../services/gemini';

const DB_NAME = 'agrocare_offline_db';
const DB_VERSION = 1;
const STORE_DIAGNOSES = 'diagnoses';
const STORE_PENDING_SYNCS = 'pending_syncs';

export interface StoredDiagnosis extends DiagnosisResult {
  id: string;
  timestamp: number;
  imageUrl?: string;
  isOfflineCache?: boolean;
}

export interface PendingSyncAction {
  id: string;
  type: 'SAVE_DIAGNOSIS' | 'DELETE_DIAGNOSIS' | 'SAVE_PROFILE';
  data: any;
  timestamp: number;
}

// Comprehensive Offline Agricultural Disease & Treatment Library (Available 100% Offline)
export const OFFLINE_DISEASE_LIBRARY: StoredDiagnosis[] = [
  {
    id: 'off-coconut-budrot',
    crop: 'Coconut',
    disease: 'Bud Rot (Phytophthora palmivora)',
    diseaseHi: 'बड रॉट (कलिका सड़न)',
    diseaseKn: 'ಮೊಗ್ಗು ಕೊಳೆ ರೋಗ',
    confidence: 99,
    description: 'Characterized by withering and yellowing of the central spindle leaf followed by soft rotting of the apical bud tissues with a foul smell.',
    symptoms: [
      'Discoloration and yellowing of central spear leaf',
      'Rotting and collapse of crown apical bud',
      'Dark water-soaked lesions at the base of petiole',
      'Easily detachable central leaf spindle'
    ],
    prevention: {
      immediate: [
        'Excision and burning of severely rotten tissues',
        'Apply 1% Bordeaux mixture or Copper Oxychloride to crown region'
      ],
      longTerm: [
        'Ensure proper orchard drainage during heavy monsoon periods',
        'Maintain 7.5m spacing between palms to lower field humidity'
      ]
    },
    treatment: {
      organic: {
        name: 'Bordeaux Paste 1% & Trichoderma Viride',
        nameHi: 'बोर्डो पेस्ट 1% और ट्राइकोडर्मा विरिडे',
        dosage: '100g paste smeared on cleaned crown surface',
        frequency: 'Immediate application, repeat after 15 days if monsoon continues',
        precautions: 'Apply on dry mornings; do not contaminate honey bee colonies',
        costEstimate: '₹ 350 / Hectare'
      },
      chemical: {
        name: 'Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ)',
        nameHi: 'मेटालेक्सिल + मेंकोजेब (रिडोमिल)',
        dosage: '2.5g / Liter of water (1.5kg / Hectare)',
        frequency: 'Every 14 to 21 days during humid weather',
        precautions: 'Wear protective mask and chemical-resistant gloves',
        costEstimate: '₹ 520 / Hectare'
      }
    },
    actionRequired: 'Immediate Crown Cleansing & Fungicide Smearing',
    severity: 'High',
    timestamp: Date.now() - 86400000,
    isOfflineCache: true
  },
  {
    id: 'off-tomato-blight',
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    diseaseHi: 'टमाटर का अगेती झुलसा',
    diseaseKn: 'ಟೊಮೆಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ ರೋಗ',
    confidence: 97,
    description: 'Fungal disease causing brown-black concentric ring spots (target board spots) on older bottom leaves, advancing upwards.',
    symptoms: [
      'Concentric target-like rings on lower leaves',
      'Yellow chlorotic halos surrounding brown spots',
      'Premature leaf defoliation leading to sun-scald on fruits'
    ],
    prevention: {
      immediate: [
        'Prune and safely destroy lower infected leaves',
        'Avoid overhead sprinkler watering to keep foliage dry'
      ],
      longTerm: [
        'Practice 3-year crop rotation with non-solanaceous crops',
        'Use plastic mulch to prevent soil spores splashing onto lower canopy'
      ]
    },
    treatment: {
      organic: {
        name: 'Neem Oil 10,000 PPM + Cow Urine Extract',
        nameHi: 'नीम का तेल (10,000 PPM) + गोमूत्र अर्क',
        dosage: '5ml Neem Oil + 100ml Cow Urine per Liter water',
        frequency: 'Every 7 days at sunset',
        precautions: 'Spray thoroughly on lower side of leaves',
        costEstimate: '₹ 280 / Hectare'
      },
      chemical: {
        name: 'Chlorothalonil 75% WP or Azoxystrobin 23% SC',
        nameHi: 'क्लोरोथैलोनिल या एज़ोक्सीस्ट्रोबिन',
        dosage: '2g per Liter (Chlorothalonil) or 1ml per Liter (Azoxystrobin)',
        frequency: 'Every 10 to 12 days',
        precautions: 'Observe 5-day pre-harvest waiting period',
        costEstimate: '₹ 450 / Hectare'
      }
    },
    actionRequired: 'Targeted Canopy Spray & Lower Leaf Pruning',
    severity: 'Medium',
    timestamp: Date.now() - 172800000,
    isOfflineCache: true
  },
  {
    id: 'off-rice-blast',
    crop: 'Paddy (Rice)',
    disease: 'Rice Blast (Magnaporthe oryzae)',
    diseaseHi: 'धान का झोंका रोग (ब्लास्ट)',
    diseaseKn: 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ',
    confidence: 96,
    description: 'Devastating fungal infection causing spindle-shaped lesions on leaves and neck rot on panicles, leading to chaffy grains.',
    symptoms: [
      'Diamond or spindle-shaped lesions with gray/white centers and brown margins',
      'Blackish-brown rotting at neck node of panicles (Neck Blast)',
      'Severe lodging of tillers under high nitrogen fertilization'
    ],
    prevention: {
      immediate: [
        'Drain standing excess water and avoid immediate top-dress nitrogen',
        'Foliar spray of balanced Potassium and Silicon to reinforce cell walls'
      ],
      longTerm: [
        'Adopt blast-resistant hybrid seeds (e.g. Swarna Sub1, IR64)',
        'Treat seeds with Tricyclazole 75 WP before nursery sowing'
      ]
    },
    treatment: {
      organic: {
        name: 'Pseudomonas fluorescens & Bio-Silica extract',
        nameHi: 'स्यूडोमोनास फ्लोरेसेन्स और सिलिका अर्क',
        dosage: '10g per Liter of water as foliar drench',
        frequency: 'Spray at tillering and boot leaf emergence',
        precautions: 'Do not combine with chemical antibiotics or copper bactericides',
        costEstimate: '₹ 320 / Hectare'
      },
      chemical: {
        name: 'Tricyclazole 75% WP (Beam)',
        nameHi: 'ट्राईसाइक्लाज़ोल 75% WP',
        dosage: '0.6g per Liter of water (120g / Acre)',
        frequency: 'First spray at early leaf spot, second at 5% flowering',
        precautions: 'Ensure uniform coverage across hill canopy',
        costEstimate: '₹ 600 / Hectare'
      }
    },
    actionRequired: 'Stop Nitrogen Fertilization & Spray Blasticide',
    severity: 'High',
    timestamp: Date.now() - 259200000,
    isOfflineCache: true
  },
  {
    id: 'off-cotton-bollworm',
    crop: 'Cotton',
    disease: 'Pink Bollworm (Pectinophora gossypiella)',
    diseaseHi: 'कपास की गुलाबी सुंडी',
    diseaseKn: 'ಹತ್ತಿ ಗುಲಾಬಿ ಕಾಯಿಕೊರೆಯುವ ಹುಳು',
    confidence: 94,
    description: 'Larvae bore into cotton squares and bolls, destroying lint quality and causing stained rosette flowers.',
    symptoms: [
      'Rosette-shaped closed flowers that fail to bloom normally',
      'Tiny bore entry holes plugged with dark frass on green bolls',
      'Discolored, hollowed-out developing cotton seeds'
    ],
    prevention: {
      immediate: [
        'Install 5 Pheromone traps (Gossyplure) per acre for monitoring',
        'Handpick and destroy rosette flowers daily'
      ],
      longTerm: [
        'Avoid extending crop season beyond 160 days to break pest cycle',
        'Destroy cotton stubble immediately after harvest'
      ]
    },
    treatment: {
      organic: {
        name: 'Neem Seed Kernel Extract 5% (NSKE) + Trichogramma Cards',
        nameHi: 'नीम बीज अर्क 5% + ट्राइकोग्रैमा कार्ड',
        dosage: '50g NSKE per Liter + 2 Trichogramma egg cards per acre',
        frequency: 'Release egg cards every 10 days during square formation',
        precautions: 'Release beneficial cards in evening hours',
        costEstimate: '₹ 400 / Hectare'
      },
      chemical: {
        name: 'Profenofos 50% EC or Emamectin Benzoate 5% SG',
        nameHi: 'प्रोफेनोफॉस 50% EC या एमामेक्टिन बेंजोएट',
        dosage: '2ml / Liter (Profenofos) or 0.5g / Liter (Emamectin)',
        frequency: 'Spray when trap catch exceeds 8 moths/trap for 3 consecutive days',
        precautions: 'Rotate chemical groups to avoid resistance',
        costEstimate: '₹ 650 / Hectare'
      }
    },
    actionRequired: 'Pheromone Trap Monitoring & Targeted Larvicide',
    severity: 'High',
    timestamp: Date.now() - 345600000,
    isOfflineCache: true
  },
  {
    id: 'off-potato-lateblight',
    crop: 'Potato',
    disease: 'Late Blight (Phytophthora infestans)',
    diseaseHi: 'आलू का पछेती झुलसा',
    diseaseKn: 'ಆಲೂಗಡ್ಡೆ ತಡವಾದ ಅಂಗಮಾರಿ ರೋಗ',
    confidence: 98,
    description: 'Rapidly spreading fungal disease during cool, moist weather causing water-soaked leaf decay and brown tuber rot.',
    symptoms: [
      'Large, irregular dark water-soaked spots on leaf tips and margins',
      'White cottony fungal down on leaf undersides in early morning',
      'Foul decaying smell and rapid collapse of entire crop canopy'
    ],
    prevention: {
      immediate: [
        'Stop irrigation immediately during overcast/rainy weather',
        'Kill haulms (cut vines) 10 days before harvest to protect underground tubers'
      ],
      longTerm: [
        'Plant certified disease-free seed tubers (Kufri Jyoti, Kufri Pukhraj)',
        'Maintain high soil earthing up to prevent zoospore contact with tubers'
      ]
    },
    treatment: {
      organic: {
        name: 'Copper Hydroxide 53.8% DF + Trichoderma harzianum',
        nameHi: 'कॉपर हाइड्रोक्साइड + ट्राइकोडर्मा',
        dosage: '2g Copper Hydroxide per Liter of water',
        frequency: 'Every 7 to 10 days during high fog conditions',
        precautions: 'Do not spray when rain is imminent within 2 hours',
        costEstimate: '₹ 420 / Hectare'
      },
      chemical: {
        name: 'Cymoxanil 8% + Mancozeb 64% WP (Curzate)',
        nameHi: 'साइमोक्सानिल + मेंकोजेब',
        dosage: '3g per Liter of water',
        frequency: 'Immediately at first symptom appearance, repeat after 7 days',
        precautions: 'Full canopy coverage is essential',
        costEstimate: '₹ 750 / Hectare'
      }
    },
    actionRequired: 'Urgent Curative Fungicide Application',
    severity: 'High',
    timestamp: Date.now() - 432000000,
    isOfflineCache: true
  },
  {
    id: 'off-chilli-leafcurl',
    crop: 'Chilli',
    disease: 'Leaf Curl Viral Disease (Transmitted by Whitefly/Thrips)',
    diseaseHi: 'मिर्च का पर्ण कुंचन (मरोड़िया रोग)',
    diseaseKn: 'ಮೆಣಸಿನಕಾಯಿ ಎಲೆ ಮುದುರುವ ರೋಗ',
    confidence: 95,
    description: 'Viral syndrome causing severe upward and downward leaf curling, stunting, and bushy rosette appearance.',
    symptoms: [
      'Upward and downward curling of young leaves with thickened veins',
      'Stunting of plant height with closely clustered nodes',
      'Drastic reduction in flower fruit set with deformed mini chillies'
    ],
    prevention: {
      immediate: [
        'Uproot and bury severely virus-stunted plants to stop spread',
        'Install yellow and blue sticky traps (15 per acre) for vector control'
      ],
      longTerm: [
        'Grow barrier crops like 2 rows of maize or jowar around chilli border',
        'Treat nursery seedlings with Imidacloprid dip before transplanting'
      ]
    },
    treatment: {
      organic: {
        name: 'Pongamia (Karanja) Oil 2% + Sour Buttermilk (Chaas) Spray',
        nameHi: 'करंज तेल + खट्टी छाछ का छिड़काव',
        dosage: '10ml Karanja oil + 50ml fermented buttermilk per Liter water',
        frequency: 'Every 5 to 7 days in early vegetative stage',
        precautions: 'Spray in cool late afternoon to avoid leaf scorch',
        costEstimate: '₹ 220 / Hectare'
      },
      chemical: {
        name: 'Diafenthiuron 50% WP or Spiromesifen 22.9% SC',
        nameHi: 'डायफेंथियूरॉन या स्पाइरोमेसिफेन',
        dosage: '1.2g per Liter (Diafenthiuron) or 1ml per Liter (Spiromesifen)',
        frequency: 'Apply to suppress whitefly and mite populations',
        precautions: 'Use high-pressure hollow cone nozzle for underside reach',
        costEstimate: '₹ 580 / Hectare'
      }
    },
    actionRequired: 'Sticky Trap Deployment & Vector Insecticide Spray',
    severity: 'Medium',
    timestamp: Date.now() - 518400000,
    isOfflineCache: true
  }
];

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DIAGNOSES)) {
        const diagnosisStore = db.createObjectStore(STORE_DIAGNOSES, { keyPath: 'id' });
        diagnosisStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PENDING_SYNCS)) {
        db.createObjectStore(STORE_PENDING_SYNCS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save diagnosis to persistent offline store
export async function saveDiagnosisOffline(
  diagnosis: DiagnosisResult, 
  imageUrl?: string | null
): Promise<StoredDiagnosis> {
  const storedItem: StoredDiagnosis = {
    ...diagnosis,
    id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    imageUrl: imageUrl || undefined,
    isOfflineCache: true
  };

  // 1. Always update localStorage for synchronous fast access
  try {
    localStorage.setItem('agrocare_latest_diagnosis', JSON.stringify(storedItem));
    
    const existingRaw = localStorage.getItem('agrocare_offline_diagnoses');
    let list: StoredDiagnosis[] = existingRaw ? JSON.parse(existingRaw) : [];
    list = [storedItem, ...list.filter(d => d.id !== storedItem.id)].slice(0, 30);
    localStorage.setItem('agrocare_offline_diagnoses', JSON.stringify(list));
  } catch (err) {
    console.warn('[OfflineStorage] LocalStorage write error:', err);
  }

  // 2. Persist in IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DIAGNOSES, 'readwrite');
    const store = tx.objectStore(STORE_DIAGNOSES);
    store.put(storedItem);
  } catch (err) {
    console.warn('[OfflineStorage] IndexedDB write error:', err);
  }

  return storedItem;
}

// Retrieve all offline diagnoses (combining local stored scans with pre-cached knowledge library)
export async function getOfflineDiagnoses(): Promise<StoredDiagnosis[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DIAGNOSES, 'readonly');
    const store = tx.objectStore(STORE_DIAGNOSES);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const stored: StoredDiagnosis[] = request.result || [];
        if (stored.length > 0) {
          // Merge with offline library without duplicates
          const merged = [...stored];
          OFFLINE_DISEASE_LIBRARY.forEach(libItem => {
            if (!merged.some(m => m.crop === libItem.crop && m.disease === libItem.disease)) {
              merged.push(libItem);
            }
          });
          resolve(merged);
        } else {
          // Fallback to localStorage or default library
          const fromLocal = getDiagnosesFromLocalStorage();
          resolve(fromLocal.length > 0 ? fromLocal : OFFLINE_DISEASE_LIBRARY);
        }
      };
      request.onerror = () => {
        const fromLocal = getDiagnosesFromLocalStorage();
        resolve(fromLocal.length > 0 ? fromLocal : OFFLINE_DISEASE_LIBRARY);
      };
    });
  } catch {
    const fromLocal = getDiagnosesFromLocalStorage();
    return fromLocal.length > 0 ? fromLocal : OFFLINE_DISEASE_LIBRARY;
  }
}

function getDiagnosesFromLocalStorage(): StoredDiagnosis[] {
  try {
    const raw = localStorage.getItem('agrocare_offline_diagnoses');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch (e) {
    console.error('Failed to parse localStorage diagnoses:', e);
  }
  return [];
}

// Get the latest single diagnosis (or default Coconut Bud Rot)
export async function getLatestDiagnosisOffline(): Promise<StoredDiagnosis> {
  try {
    const stored = localStorage.getItem('agrocare_latest_diagnosis');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[OfflineStorage] Error reading latest diagnosis from local storage:', e);
  }

  const list = await getOfflineDiagnoses();
  return list[0] || OFFLINE_DISEASE_LIBRARY[0];
}

// Delete an offline diagnosis record
export async function deleteOfflineDiagnosis(id: string): Promise<void> {
  try {
    const raw = localStorage.getItem('agrocare_offline_diagnoses');
    if (raw) {
      const list = JSON.parse(raw).filter((item: StoredDiagnosis) => item.id !== id);
      localStorage.setItem('agrocare_offline_diagnoses', JSON.stringify(list));
    }
  } catch (e) {
    console.error(e);
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DIAGNOSES, 'readwrite');
    tx.objectStore(STORE_DIAGNOSES).delete(id);
  } catch (e) {
    console.error(e);
  }
}

// Queue an action while offline to sync later
export async function queueOfflineAction(type: PendingSyncAction['type'], data: any): Promise<void> {
  const item: PendingSyncAction = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    data,
    timestamp: Date.now()
  };

  try {
    const existingRaw = localStorage.getItem('agrocare_pending_syncs');
    const existing: PendingSyncAction[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push(item);
    localStorage.setItem('agrocare_pending_syncs', JSON.stringify(existing));
  } catch (e) {
    console.warn(e);
  }
}

// Retrieve pending sync queue
export function getPendingOfflineActions(): PendingSyncAction[] {
  try {
    const raw = localStorage.getItem('agrocare_pending_syncs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Clear synced queue
export function clearPendingOfflineActions(): void {
  try {
    localStorage.removeItem('agrocare_pending_syncs');
  } catch (e) {
    console.error(e);
  }
}

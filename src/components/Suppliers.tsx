import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ShoppingBag, Filter, Navigation, Star, Phone, MapPin, 
  Loader2, LocateFixed, Compass, Info, Search, X, Clock, Mail, Globe, 
  ExternalLink, ChevronUp, ChevronDown, RotateCcw, AlertCircle, Sparkles
} from 'lucide-react';
import { Supplier, Language } from '../types';
import { SUPPLIERS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchOfficialShopName } from '../services/placesService';
import { toast } from 'sonner';

class MapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    console.error("Map rendering error:", error);
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-red-50 text-center z-50 rounded-2xl border border-red-100">
          <div className="bg-white p-3 rounded-full mb-3 shadow-xs"><MapPin size={28} className="text-red-500" /></div>
          <h3 className="text-base font-bold text-red-800 mb-1">Map Unavailable</h3>
          <p className="text-xs text-red-600 mb-4 max-w-xs">An error occurred while rendering the map. Please retry loading.</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-5 py-2 bg-red-600 text-white text-xs rounded-xl font-bold shadow-xs hover:bg-red-700 transition">Retry Loading Map</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Marker icon configuration
const markerIcon2x = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const supplierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createClusterIcon = (count: number) => L.divIcon({
  className: 'agrocare-supplier-cluster',
  html: `<div style="width:44px;height:44px;border-radius:9999px;background:#1B5E20;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;border:3px solid white;box-shadow:0 10px 25px rgba(0,0,0,.25);">${count}</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

interface SuppliersProps {
  onBack: () => void;
  language: Language;
  initialSearch?: string;
}

// Helper: Calculate distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Component to control map viewport and fly animations
const MapUpdater = ({ 
  selectedSupplier, 
  latitude, 
  longitude, 
  suppliers, 
  mapFlyTrigger, 
  fitBoundsTrigger,
  routeCoordinates 
}: { 
  selectedSupplier: Supplier | null, 
  latitude: number | null, 
  longitude: number | null, 
  suppliers: Supplier[], 
  mapFlyTrigger: number, 
  fitBoundsTrigger: number,
  routeCoordinates: [number, number][]
}) => {
  const map = useMap();
  const prevSupplierIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedSupplier && selectedSupplier.lat && selectedSupplier.lng && latitude && longitude) {
      const isNewSelection = prevSupplierIdRef.current !== selectedSupplier.id;
      const wasNull = prevSupplierIdRef.current === null;
      prevSupplierIdRef.current = selectedSupplier.id;

      if (wasNull) {
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [selectedSupplier.lat, selectedSupplier.lng]
        ]);
        if (routeCoordinates && routeCoordinates.length > 0) {
          routeCoordinates.forEach(coord => bounds.extend(coord));
        }
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } else if (isNewSelection) {
        map.flyTo([selectedSupplier.lat, selectedSupplier.lng], 15, { 
          duration: 1.0,
          easeLinearity: 0.25
        });

        const timer = setTimeout(() => {
          const bounds = L.latLngBounds([
            [latitude, longitude],
            [selectedSupplier.lat!, selectedSupplier.lng!]
          ]);

          if (routeCoordinates && routeCoordinates.length > 0) {
            routeCoordinates.forEach(coord => bounds.extend(coord));
          }

          map.flyToBounds(bounds, { 
            padding: [60, 60], 
            duration: 1.0,
            maxZoom: 15
          });
        }, 1100);

        return () => clearTimeout(timer);
      } else {
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [selectedSupplier.lat, selectedSupplier.lng]
        ]);
        if (routeCoordinates && routeCoordinates.length > 0) {
          routeCoordinates.forEach(coord => bounds.extend(coord));
        }
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.0, maxZoom: 15 });
      }
    }
  }, [selectedSupplier, latitude, longitude, map, routeCoordinates]);

  useEffect(() => {
    if (fitBoundsTrigger > 0 && suppliers.length > 0 && latitude && longitude) {
      const bounds = L.latLngBounds(suppliers.map(s => [s.lat!, s.lng!]));
      bounds.extend([latitude, longitude]);
      map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
    }
  }, [fitBoundsTrigger, suppliers, latitude, longitude, map]);

  useEffect(() => {
    if (mapFlyTrigger > 0 && latitude && longitude) {
      map.flyTo([latitude, longitude], 13, { duration: 1.2 });
    }
  }, [mapFlyTrigger, latitude, longitude, map]);

  return null;
};

const ZoomAwareSupplierMarkers = ({
  suppliers,
  selectedSupplier,
  onSelectSupplier,
}: {
  suppliers: Supplier[],
  selectedSupplier: Supplier | null,
  onSelectSupplier: (supplier: Supplier) => void,
}) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const positionedSuppliers = suppliers.filter((supplier) => supplier.lat && supplier.lng);

  if (zoom < 13 && positionedSuppliers.length > 1) {
    const centerLat = positionedSuppliers.reduce((sum, supplier) => sum + supplier.lat!, 0) / positionedSuppliers.length;
    const centerLng = positionedSuppliers.reduce((sum, supplier) => sum + supplier.lng!, 0) / positionedSuppliers.length;

    return (
      <Marker position={[centerLat, centerLng]} icon={createClusterIcon(positionedSuppliers.length)}>
        <Popup>
          <div className="font-bold text-sm text-earth">{positionedSuppliers.length} suppliers nearby</div>
          <div className="text-xs text-gray-500 mt-1">Zoom in to inspect individual stores.</div>
        </Popup>
      </Marker>
    );
  }

  return (
    <>
      {positionedSuppliers.map((supplier) => (
        <Marker 
          key={supplier.id} 
          position={[supplier.lat!, supplier.lng!]} 
          icon={selectedSupplier?.id === supplier.id ? selectedIcon : supplierIcon}
          eventHandlers={{
            click: () => onSelectSupplier(supplier),
          }}
        >
          <Tooltip direction="top" offset={[0, -40]} className="bg-white border-none shadow-md font-bold text-xs px-2.5 py-1 rounded-lg text-earth">
            {supplier.name} <span className="text-amber-500 font-extrabold ml-1">★ {supplier.rating}</span>
          </Tooltip>
          <Popup>
            <div className="font-bold text-sm text-earth">{supplier.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{supplier.distance} km away</div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

// Skeleton Card for smooth loading state
const SupplierCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-4 w-20 bg-gray-200 rounded-md"></div>
      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="space-y-2">
      <div className="h-5 w-3/4 bg-gray-200 rounded-md"></div>
      <div className="h-3.5 w-1/2 bg-gray-200 rounded-md"></div>
    </div>
    <div className="flex items-center gap-3">
      <div className="h-4 w-16 bg-gray-200 rounded-md"></div>
      <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
    </div>
    <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
      <div className="h-9 w-24 bg-gray-200 rounded-xl"></div>
      <div className="h-9 w-20 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

export const Suppliers: React.FC<SuppliersProps> = ({ onBack, language, initialSearch }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { latitude: geoLat, longitude: geoLng, accuracy: geoAccuracy, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  const [latitude, setLatitude] = useState<number>(15.3173); // Default Karnataka
  const [longitude, setLongitude] = useState<number>(75.7139);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const [isLocationBannerDismissed, setIsLocationBannerDismissed] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [filterMode, setFilterMode] = useState<'single' | 'multi'>('single');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState<string>('All');

  const handleFilterModeChange = (mode: 'single' | 'multi') => {
    setFilterMode(mode);
    if (mode === 'single' && selectedTags.length > 1) {
      setSelectedTags([selectedTags[0]]);
    }
  };

  const handleTagClick = (tag: string) => {
    if (filterMode === 'single') {
      if (selectedTags.includes(tag)) {
        setSelectedTags([]);
      } else {
        setSelectedTags([tag]);
      }
    } else {
      if (selectedTags.includes(tag)) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [expandedSupplier, setExpandedSupplier] = useState<Supplier | null>(null);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [mapFlyTrigger, setMapFlyTrigger] = useState(0);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);
  const listRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const initialLocationRef = useRef<{lat: number, lng: number} | null>(null);

  // Touch & Mouse swipe drag-scroll support for filter pills
  const filterScrollRef = useRef<HTMLDivElement | null>(null);
  const [isFilterDragging, setIsFilterDragging] = useState(false);
  const [filterStartX, setFilterStartX] = useState(0);
  const [filterScrollLeft, setFilterScrollLeft] = useState(0);
  const [hasDraggedFilter, setHasDraggedFilter] = useState(false);

  const centerFilterPill = (target: HTMLElement | null) => {
    if (!filterScrollRef.current || !target) return;
    const container = filterScrollRef.current;
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetCenter = targetRect.left + targetRect.width / 2;
    const containerCenter = containerRect.left + containerRect.width / 2;
    const offset = targetCenter - containerCenter;
    container.scrollBy({
      left: offset,
      behavior: 'smooth'
    });
  };

  const openCount = React.useMemo(() => {
    return SUPPLIERS.filter(s => s.status === 'open').length || 1;
  }, []);

  const tagCounts = React.useMemo(() => {
    const tags = ['Mancozeb', 'Organic', 'Seeds', 'Tools'];
    const map: Record<string, number> = {};
    tags.forEach(tag => {
      const count = SUPPLIERS.filter(s => 
        s.tags && s.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      ).length;
      map[tag] = count > 0 ? count : 1;
    });
    return map;
  }, []);

  const handleFilterMouseDown = (e: React.MouseEvent) => {
    if (!filterScrollRef.current) return;
    setIsFilterDragging(true);
    setHasDraggedFilter(false);
    setFilterStartX(e.pageX - filterScrollRef.current.offsetLeft);
    setFilterScrollLeft(filterScrollRef.current.scrollLeft);
  };

  const handleFilterMouseLeaveOrUp = () => {
    setIsFilterDragging(false);
  };

  const handleFilterMouseMove = (e: React.MouseEvent) => {
    if (!isFilterDragging || !filterScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - filterStartX) * 1.5;
    if (Math.abs(walk) > 5) {
      setHasDraggedFilter(true);
    }
    filterScrollRef.current.scrollLeft = filterScrollLeft - walk;
  };

  const handleFilterTouchStart = (e: React.TouchEvent) => {
    if (!filterScrollRef.current || e.touches.length === 0) return;
    setHasDraggedFilter(false);
    setFilterStartX(e.touches[0].pageX - filterScrollRef.current.offsetLeft);
    setFilterScrollLeft(filterScrollRef.current.scrollLeft);
  };

  const handleFilterTouchMove = (e: React.TouchEvent) => {
    if (!filterScrollRef.current || e.touches.length === 0) return;
    const x = e.touches[0].pageX - filterScrollRef.current.offsetLeft;
    const walk = (x - filterStartX);
    if (Math.abs(walk) > 5) {
      setHasDraggedFilter(true);
    }
  };

  const MOCK_HOURS = [
    { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Thursday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Friday', hours: '8:00 AM - 8:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 4:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  useEffect(() => {
    if (selectedSupplier && listRefs.current[selectedSupplier.id]) {
      listRefs.current[selectedSupplier.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (geoLat && geoLng) {
      setLatitude(geoLat);
      setLongitude(geoLng);
      setError(null);
      setIsFallback(false);
      setIsLocationBannerDismissed(false);
      setMapFlyTrigger(prev => prev + 1);
    }
  }, [geoLat, geoLng]);

  useEffect(() => {
    if (locationError) {
      console.warn("Geolocation failed:", locationError);
      setLatitude(15.3173);
      setLongitude(75.7139);
      setError(locationError);
      setIsFallback(true);
      setIsLocationBannerDismissed(false);
    }
  }, [locationError]);

  useEffect(() => {
    if (latitude && longitude) {
      if (!initialLocationRef.current) {
        initialLocationRef.current = { lat: latitude, lng: longitude };
      }
      
      setLoading(true);
      const timerId = setTimeout(() => {
        try {
          let results = SUPPLIERS.map((s, i) => {
            const pseudoRandom1 = Math.sin(i * 12.9898) * 43758.5453;
            const pseudoRandom2 = Math.cos(i * 78.233) * 43758.5453;
            const offsetLat = (pseudoRandom1 - Math.floor(pseudoRandom1) - 0.5) * 0.05;
            const offsetLng = (pseudoRandom2 - Math.floor(pseudoRandom2) - 0.5) * 0.05;
            
            const lat = s.lat || latitude + offsetLat;
            const lng = s.lng || longitude + offsetLng;
            const actualDistance = getDistanceKm(latitude, longitude, lat, lng).toFixed(1);
            return { ...s, lat, lng, distance: `${actualDistance}` };
          });

          let filtered = [...results];

          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(query) || 
              (s.tags && s.tags.some(tag => tag.toLowerCase().includes(query))) ||
              (s.address && s.address.toLowerCase().includes(query))
            );
          }

          if (selectedTags.length > 0) {
            filtered = filtered.filter(s => s.tags && s.tags.some(tag => selectedTags.includes(tag)));
          }
          
          if (filtered.length === 0 && results.length > 0 && (searchQuery || selectedTags.length > 0)) {
            const matchedToken = selectedTags[0] || searchQuery;
            if (matchedToken) {
              results[0] = { ...results[0], tags: [matchedToken, ...(results[0].tags || [])] };
              filtered = [results[0]];
            }
          }

          if (openingHours !== 'All') {
            filtered = filtered.filter(s => s.status === openingHours);
          }
          
          filtered = filtered.filter(s => {
            const dist = parseFloat(s.distance as string);
            return !isNaN(dist) && dist <= maxDistance;
          });

          filtered = filtered.filter(s => s.rating >= minRating);

          setSuppliers(filtered);
          if (filtered.length > 0 && !selectedSupplier) {
            setSelectedSupplier(filtered[0]);
          } else if (filtered.length === 0) {
            setSelectedSupplier(null);
          }
        } catch (err) {
          console.error("Error processing suppliers:", err);
        } finally {
          setLoading(false);
        }
      }, 400);

      return () => clearTimeout(timerId);
    }
  }, [latitude, longitude, locationError, selectedTags, openingHours, maxDistance, minRating, searchQuery]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (latitude && longitude && selectedSupplier?.lat && selectedSupplier?.lng) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${selectedSupplier.lng},${selectedSupplier.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            setRouteCoordinates(coords);
          } else {
            setRouteCoordinates([
              [latitude, longitude],
              [selectedSupplier.lat, selectedSupplier.lng]
            ]);
          }
        } catch (error) {
          setRouteCoordinates([
            [latitude, longitude],
            [selectedSupplier.lat, selectedSupplier.lng]
          ]);
        }
      } else {
        setRouteCoordinates([]);
      }
    };

    fetchRoute();
  }, [latitude, longitude, selectedSupplier]);

  const handleVerifyName = async (supplier: Supplier) => {
    setVerifyingId(supplier.id);
    try {
      const result = await fetchOfficialShopName(supplier.name, 'store');
      const officialName = result.officialName;
      
      const origName = supplier.originalName || supplier.name;
      const differed = officialName.trim().toLowerCase() !== origName.trim().toLowerCase();

      setSuppliers(prev => prev.map(s => {
        if (s.id === supplier.id) {
          const updatedSupplier = {
            ...s,
            name: officialName,
            nameVerified: true,
            originalName: origName,
            officialNameDiffered: differed
          };
          if (selectedSupplier && selectedSupplier.id === s.id) {
            setSelectedSupplier(updatedSupplier);
          }
          if (expandedSupplier && expandedSupplier.id === s.id) {
            setExpandedSupplier(updatedSupplier);
          }
          return updatedSupplier;
        }
        return s;
      }));

      if (differed) {
        toast.success(
          language === 'hi' 
            ? `आधिकारिक नाम अपडेट किया गया: ${officialName}` 
            : language === 'kn' 
              ? `ಅಧಿಕೃತ ಹೆಸರು ನವೀಕರಿಸಲಾಗಿದೆ: ${officialName}` 
              : `Updated to official name: ${officialName}`
        );
      } else {
        toast.info(
          language === 'hi' 
            ? "नाम पहले से ही आधिकारिक है।" 
            : language === 'kn' 
              ? "ಹೆಸರು ಈಗಾಗಲೇ ಅಧಿಕೃತವಾಗಿದೆ." 
              : "Name is already official."
        );
      }
    } catch (err) {
      toast.error(
        language === 'hi' 
          ? "आधिकारिक नाम सत्यापित करने में विफल।" 
          : language === 'kn' 
            ? "ಅಧಿಕೃತ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ." 
            : "Failed to verify official name."
      );
    } finally {
      setVerifyingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setOpeningHours('All');
    setMaxDistance(50);
    setMinRating(0);
  };

  const handleCenterOnMe = () => {
    setIsLocationBannerDismissed(false);
    requestLocation();
    setSelectedSupplier(null);
    toast.info(
      language === 'hi' 
        ? "आपकी सटीक स्थिति खोज रहे हैं..." 
        : language === 'kn' 
          ? "ನಿಮ್ಮ ನಿಖರವಾದ ಸ್ಥಳವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ..." 
          : "Requesting your precise location...",
      { id: 'center-location' }
    );
  };

  const showFallbackLocationBanner = isFallback && !locationLoading && !isLocationBannerDismissed;
  const showLowAccuracyBanner = !isFallback && geoAccuracy !== null && geoAccuracy > 500 && !isLocationBannerDismissed;

  return (
    <motion.div 
      id="supplier-map" 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col bg-[#F8F9FA] h-[100dvh] min-h-[500px] w-full relative z-40 overflow-hidden select-none"
    >
      {/* Page Header */}
      <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg lg:text-xl font-black text-earth tracking-tight leading-none">
              {language === 'hi' ? 'आस-पास के आपूर्तिकर्ता' : language === 'kn' ? 'ಹತ್ತಿರದ ಸರಬರಾಜುದಾರರು' : 'Nearby Agro Suppliers'}
            </h1>
            <span className="text-[11px] font-bold text-gray-400 mt-0.5">
              Store Locator & Agricultural Input Centers
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFallback && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full">
              <Info size={14} className="text-amber-600" />
              <span>Karnataka Center</span>
            </span>
          )}
          <button 
            onClick={() => toast.info("Shopping Cart: 0 items selected")}
            className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 relative transition-colors cursor-pointer"
            aria-label="View Cart"
          >
            <ShoppingBag size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 min-h-0 w-full flex flex-col lg:flex-row overflow-hidden relative z-10">
        
        {/* DESKTOP LEFT PANEL (60% WIDTH) / MOBILE TOP AREA - MAP CONTAINER */}
        <div 
          id="map-container"
          className={`w-full lg:w-[60%] ${isMobileSheetExpanded ? 'h-64 sm:h-72 lg:h-full' : 'h-96 sm:h-[48vh] lg:h-full flex-1 sm:flex-initial lg:flex-1'} min-h-[260px] lg:min-h-0 shrink-0 bg-gray-100 relative z-10 p-2 lg:p-4 transition-all duration-300 flex flex-col`}
        >
          <div className="w-full h-full min-h-[240px] flex-1 rounded-2xl lg:rounded-3xl overflow-hidden border border-gray-200/80 shadow-xs relative bg-white flex flex-col z-0">
            <MapErrorBoundary>
              {latitude && longitude ? (
                <MapContainer 
                  center={[latitude, longitude]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%', minHeight: '100%' }}
                  className="h-full w-full flex-1 z-0 relative"
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <MapUpdater
                    selectedSupplier={selectedSupplier}
                    latitude={latitude}
                    longitude={longitude}
                    suppliers={suppliers}
                    mapFlyTrigger={mapFlyTrigger}
                    fitBoundsTrigger={fitBoundsTrigger}
                    routeCoordinates={routeCoordinates}
                  />
                  
                  {/* User Pin */}
                  <Marker position={[latitude, longitude]} icon={userIcon}>
                    <Popup>
                      <div className="font-bold text-xs">Your Location</div>
                    </Popup>
                  </Marker>

                  {/* Supplier Pins / Cluster */}
                  <ZoomAwareSupplierMarkers
                    suppliers={suppliers}
                    selectedSupplier={selectedSupplier}
                    onSelectSupplier={setSelectedSupplier}
                  />

                  {/* Route Polyline */}
                  {routeCoordinates.length > 0 && (
                    <>
                      <Polyline 
                        positions={routeCoordinates} 
                        color="#1B5E20" 
                        weight={8}
                        opacity={0.25}
                        lineJoin="round"
                        lineCap="round"
                      />
                      <Polyline 
                        positions={routeCoordinates} 
                        color="#2E7D32" 
                        weight={5}
                        opacity={0.85}
                        lineJoin="round"
                        lineCap="round"
                      />
                      <Polyline 
                        positions={routeCoordinates} 
                        color="#E8F5E9" 
                        weight={2.5}
                        opacity={0.9}
                        lineJoin="round"
                        lineCap="round"
                        dashArray="6, 10"
                      />
                    </>
                  )}
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Loader2 className="animate-spin text-[#1B5E20]" size={36} />
                </div>
              )}
            </MapErrorBoundary>

            {/* Map Controls: Floating Top-Right Controls */}
            <div className="absolute top-3 right-3 lg:top-4 lg:right-4 flex flex-col items-end gap-2 z-[1000]">
              {/* Center on Me Button */}
              <button 
                id="center-on-me-btn"
                onClick={handleCenterOnMe}
                title="Center on Me"
                className="group bg-white hover:bg-emerald-50 active:scale-95 px-3 py-2.5 lg:px-3.5 lg:py-2.5 rounded-2xl shadow-lg border border-gray-200/90 text-[#1B5E20] transition-all flex items-center gap-2 cursor-pointer relative"
                aria-label="Center on Me"
              >
                <LocateFixed size={18} className={`shrink-0 text-[#1B5E20] ${locationLoading ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-xs font-black text-[#1B5E20] tracking-wide whitespace-nowrap">
                  {language === 'hi' ? 'मेरी स्थिति' : language === 'kn' ? 'ನನ್ನ ಸ್ಥಳ' : 'Center on Me'}
                </span>
                {isFallback && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" title="Default location active" />}
              </button>

              {/* Show All / Fit Bounds Button */}
              <button 
                onClick={() => {
                  setSelectedSupplier(null);
                  setFitBoundsTrigger(prev => prev + 1);
                }}
                title="Show all suppliers"
                className="bg-[#1B5E20] hover:bg-[#144317] px-3 py-2.5 rounded-2xl shadow-lg border border-emerald-400/30 text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                aria-label="Fit map bounds"
              >
                <Compass size={18} className="shrink-0" />
                <span className="text-xs font-bold whitespace-nowrap">
                  {language === 'hi' ? 'सभी देखें' : language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ' : 'View All'}
                </span>
              </button>
            </div>

            {/* Floating Selection Badge at Map Bottom-Left */}
            {selectedSupplier && (
              <div className="absolute bottom-6 left-3 right-14 lg:right-auto lg:max-w-xs z-[1001] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-200/80 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-[#1B5E20] rounded-xl flex items-center justify-center shrink-0 font-black text-xs">
                  {selectedSupplier.distance}km
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-earth truncate">{selectedSupplier.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate">{selectedSupplier.address}</p>
                </div>
                <button 
                  onClick={() => setExpandedSupplier(selectedSupplier)}
                  className="p-2 text-xs font-bold text-[#1B5E20] hover:bg-emerald-50 rounded-xl transition-colors shrink-0"
                >
                  Details
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP RIGHT PANEL (40% WIDTH) / MOBILE BOTTOM SHEET (55% HEIGHT) - SIDEBAR */}
        <div className="flex-1 lg:w-[40%] lg:min-w-[420px] lg:max-w-[500px] bg-white lg:border-l lg:border-gray-200/80 shadow-xl lg:shadow-none flex flex-col min-h-0 relative z-20 rounded-t-3xl lg:rounded-none -mt-4 lg:mt-0 overflow-hidden">
          
          {/* Mobile Grab Handle Bar */}
          <div 
            className="w-full flex justify-center py-2.5 shrink-0 bg-white border-b border-gray-100 lg:hidden cursor-pointer select-none"
            onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
          >
            <div className={`w-12 h-1 bg-gray-300 rounded-full transition-all duration-300 ${isMobileSheetExpanded ? 'w-20 bg-[#1B5E20]' : ''}`} />
          </div>

          {/* Unified Top-Aligned Search & Filter Header Container */}
          <div className="sticky top-0 z-30 p-3.5 lg:p-4 border-b border-gray-100 bg-white/95 backdrop-blur-md shrink-0 space-y-2.5 shadow-2xs">
            {showFallbackLocationBanner && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-3 shadow-sm flex items-start gap-3 text-amber-950">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-900">
                    {language === 'hi' ? 'स्थान सत्यापित नहीं है' : language === 'kn' ? 'ಸ್ಥಳ ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ' : 'Location needs confirmation'}
                  </p>
                  <p className="text-xs font-semibold leading-snug mt-0.5">
                    {error || (language === 'hi' ? 'हम अभी कर्नाटक केंद्र का उपयोग कर रहे हैं।' : language === 'kn' ? 'ನಾವು ಈಗ ಕರ್ನಾಟಕ ಕೇಂದ್ರವನ್ನು ಬಳಸುತ್ತಿದ್ದೇವೆ.' : 'Using fallback Karnataka location until GPS is available.')}
                  </p>
                </div>
                <button
                  onClick={handleCenterOnMe}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#1B5E20] px-3 py-2 text-[11px] font-black text-white hover:bg-[#144317] active:scale-95 transition cursor-pointer"
                >
                  <LocateFixed size={13} />
                  {language === 'hi' ? 'लोकेट' : language === 'kn' ? 'ಪತ್ತೆ' : 'Locate Me'}
                </button>
                <button
                  onClick={() => setIsLocationBannerDismissed(true)}
                  className="shrink-0 p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer"
                  aria-label="Dismiss location warning"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {showLowAccuracyBanner && (
              <div className="rounded-2xl border border-orange-300 bg-orange-50 px-3 py-3 shadow-sm flex items-start gap-3 text-orange-950">
                <AlertCircle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-orange-900">
                    {language === 'hi' ? 'GPS सटीकता कम है' : language === 'kn' ? 'GPS ನಿಖರತೆ ಕಡಿಮೆ ಇದೆ' : 'GPS accuracy is low'}
                  </p>
                  <p className="text-xs font-semibold leading-snug mt-0.5">
                    {language === 'hi'
                      ? `आपकी स्थिति लगभग ${Math.round(geoAccuracy)} मीटर तक सटीक है। बेहतर दूरी के लिए फिर से लोकेट करें।`
                      : language === 'kn'
                        ? `ನಿಮ್ಮ ಸ್ಥಳವು ಸುಮಾರು ${Math.round(geoAccuracy)} ಮೀಟರ್ ನಿಖರವಾಗಿದೆ. ಉತ್ತಮ ಅಂತರಕ್ಕಾಗಿ ಮತ್ತೆ ಪತ್ತೆ ಮಾಡಿ.`
                        : `Your location is accurate to about ${Math.round(geoAccuracy)} meters. Tap Locate Me for better distance estimates.`}
                  </p>
                </div>
                <button
                  onClick={handleCenterOnMe}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#1B5E20] px-3 py-2 text-[11px] font-black text-white hover:bg-[#144317] active:scale-95 transition cursor-pointer"
                >
                  <LocateFixed size={13} />
                  {language === 'hi' ? 'फिर से' : language === 'kn' ? 'ಮತ್ತೆ' : 'Retry'}
                </button>
                <button
                  onClick={() => setIsLocationBannerDismissed(true)}
                  className="shrink-0 p-1.5 rounded-lg text-orange-700 hover:bg-orange-100 cursor-pointer"
                  aria-label="Dismiss low accuracy warning"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-2.5 space-y-2.5 shadow-xs">
              {/* Search Bar Input */}
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3 text-gray-400 pointer-events-none" />
                <input 
                  type="text"
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200/90 rounded-xl text-sm font-medium text-earth placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent shadow-inner transition-all" 
                  placeholder="Search store name, seeds, chemical..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-gray-400 hover:text-earth p-1 cursor-pointer transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter Mode Toggle Switch Header - Placed directly above .filter-pills-container */}
              <div className="flex items-center justify-between px-0.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Filter Mode
                  </span>
                  {selectedTags.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-[#1B5E20]">
                      {selectedTags.length} active
                    </span>
                  )}
                </div>

                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl border border-gray-300/40 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleFilterModeChange('single')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      filterMode === 'single'
                        ? 'bg-white text-[#1B5E20] shadow-xs ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Single Select
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterModeChange('multi')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      filterMode === 'multi'
                        ? 'bg-white text-[#1B5E20] shadow-xs ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Multi-Select
                  </button>
                </div>
              </div>

              {/* Horizontally Scrollable Filter Chips - Always Visible Top Header */}
              <div 
                ref={filterScrollRef}
                onMouseDown={handleFilterMouseDown}
                onMouseLeave={handleFilterMouseLeaveOrUp}
                onMouseUp={handleFilterMouseLeaveOrUp}
                onMouseMove={handleFilterMouseMove}
                onTouchStart={handleFilterTouchStart}
                onTouchMove={handleFilterTouchMove}
                className={`filter-pills-container flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap h-12 py-1.5 touch-pan-x shrink-0 select-none ${
                  isFilterDragging ? 'scroll-auto snap-none cursor-grabbing' : 'scroll-smooth snap-x snap-mandatory cursor-grab'
                }`}
              >
                <button 
                  onClick={(e) => {
                    if (hasDraggedFilter) return;
                    setShowFilters(!showFilters);
                    centerFilterPill(e.currentTarget);
                  }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap snap-start touch-manipulation before:absolute before:-inset-y-1.5 before:-inset-x-1 before:content-[''] ${
                    showFilters 
                      ? 'bg-[#1B5E20] text-white border-[#1B5E20] scale-[1.04] shadow-md shadow-emerald-900/25 ring-2 ring-emerald-600/30 z-10' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-2xs opacity-90 hover:opacity-100'
                  }`}
                >
                  <Filter size={14} />
                  <span className="whitespace-nowrap">Filters</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full transition-colors leading-none ${
                    showFilters ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#1B5E20]'
                  }`}>
                    {suppliers.length}
                  </span>
                  {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <button 
                  onClick={(e) => {
                    if (hasDraggedFilter) return;
                    setOpeningHours(openingHours === 'open' ? 'All' : 'open');
                    centerFilterPill(e.currentTarget);
                  }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap snap-start touch-manipulation before:absolute before:-inset-y-1.5 before:-inset-x-1 before:content-[''] ${
                    openingHours === 'open' 
                      ? 'bg-emerald-50 text-[#1B5E20] border-emerald-400 ring-2 ring-emerald-500/30 scale-[1.04] shadow-md shadow-emerald-700/15 z-10' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-2xs opacity-90 hover:opacity-100'
                  }`}
                >
                  <Clock size={13} />
                  <span className="whitespace-nowrap">Open Now</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full transition-colors leading-none ${
                    openingHours === 'open' ? 'bg-[#1B5E20] text-white' : 'bg-emerald-100 text-[#1B5E20]'
                  }`}>
                    {openCount}
                  </span>
                </button>

                {['Mancozeb', 'Organic', 'Seeds', 'Tools'].map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      onClick={(e) => {
                        if (hasDraggedFilter) return;
                        handleTagClick(tag);
                        centerFilterPill(e.currentTarget);
                      }}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap snap-start touch-manipulation before:absolute before:-inset-y-1.5 before:-inset-x-1 before:content-[''] ${
                        isSelected 
                          ? 'bg-emerald-50 text-[#1B5E20] border-emerald-400 ring-2 ring-emerald-500/30 scale-[1.04] shadow-md shadow-emerald-700/15 z-10' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-2xs opacity-90 hover:opacity-100'
                      }`}
                    >
                      <span className="whitespace-nowrap">{tag}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full transition-colors leading-none ${
                        isSelected ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tagCounts[tag] || 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Advanced Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-gray-50/80 rounded-2xl p-3 border border-gray-200/70 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Category</label>
                      <select 
                        value={selectedTags.length === 1 ? selectedTags[0] : (selectedTags.length > 1 ? 'Multiple' : 'All')}
                        onChange={(e) => {
                          if (e.target.value === 'All') {
                            setSelectedTags([]);
                          } else {
                            setSelectedTags([e.target.value]);
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-earth focus:ring-1 focus:ring-[#1B5E20]"
                      >
                        <option value="All">All Specialties</option>
                        {selectedTags.length > 1 && <option value="Multiple">Multiple Selected ({selectedTags.length})</option>}
                        <option value="Mancozeb">Mancozeb</option>
                        <option value="Organic">Organic</option>
                        <option value="Seeds">Seeds</option>
                        <option value="Tools">Tools</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Status</label>
                      <select 
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-medium text-earth focus:ring-1 focus:ring-[#1B5E20]"
                      >
                        <option value="All">Any Time</option>
                        <option value="open">Open Now</option>
                        <option value="closing">Closing Soon</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                        <span>Max Distance</span>
                        <span className="text-[#1B5E20]">{maxDistance} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="50" 
                        value={maxDistance} 
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        className="w-full accent-[#1B5E20]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                        <span>Min Rating</span>
                        <span className="text-amber-600">★ {minRating}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        step="0.5"
                        value={minRating} 
                        onChange={(e) => setMinRating(parseFloat(e.target.value))}
                        className="w-full accent-[#1B5E20]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button 
                      onClick={resetFilters} 
                      className="text-[11px] font-bold text-gray-500 hover:text-earth flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Supplier Count & Status Bar */}
          <div className="px-5 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs shrink-0">
            <span className="font-extrabold text-gray-500 uppercase tracking-wider">
              {loading ? 'Searching Stores...' : `${suppliers.length} Stores Available`}
            </span>
            <span className="font-bold text-[#1B5E20] bg-emerald-50 px-2.5 py-1 rounded-full text-[11px]">
              Within {maxDistance}km Radius
            </span>
          </div>

          {/* Vertically Scrollable Supplier List */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-3.5 scroll-smooth hide-scrollbar">
            {loading ? (
              <>
                <SupplierCardSkeleton />
                <SupplierCardSkeleton />
                <SupplierCardSkeleton />
              </>
            ) : error && !isFallback ? (
              /* Error State Centered */
              <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-2xl border border-red-100 my-4">
                <AlertCircle className="text-red-500 mb-2" size={32} />
                <p className="text-sm font-bold text-red-800 mb-1">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            ) : suppliers.length === 0 ? (
              /* Empty State Centered */
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/80 rounded-2xl border border-dashed border-gray-200 my-4">
                <Search className="text-gray-400 mb-2" size={32} />
                <p className="text-sm font-bold text-earth mb-1">No Suppliers Found</p>
                <p className="text-xs text-gray-500 mb-4 max-w-xs">No stores matched your query or filters within {maxDistance}km radius.</p>
                <button 
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-xs font-bold hover:bg-[#144317] transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              suppliers.map((supplier, index) => {
                const isSelected = selectedSupplier?.id === supplier.id;
                const isOfficial = index === 0;
                const etaMinutes = Math.round(parseFloat(supplier.distance as string) * 1.5);

                return (
                  <motion.div 
                    key={supplier.id}
                    ref={el => { if (el) listRefs.current[supplier.id] = el; }}
                    onClick={() => setSelectedSupplier(supplier)}
                    animate={isOfficial ? {
                      scale: [1, 1.02, 1],
                    } : undefined}
                    transition={isOfficial ? {
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    } : undefined}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer relative ${
                      isOfficial
                        ? 'bg-gradient-to-br from-white via-amber-50/40 to-emerald-50/30 border-amber-300 ring-4 ring-amber-400/20 shadow-lg shadow-amber-500/10 z-10 animate-official-pulse'
                        : isSelected 
                          ? 'bg-white border-[#1B5E20] shadow-md ring-2 ring-[#1B5E20]/10' 
                          : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {isOfficial && (
                      <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-20">
                        <Sparkles size={11} className="text-amber-200 animate-pulse" />
                        <span>Official Store</span>
                      </div>
                    )}
                    {/* Top Row: Distance Top-Left, Availability Pill Top-Right */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-xs font-extrabold text-[#1B5E20] bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <MapPin size={13} />
                        <span>{supplier.distance} km away</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {supplier.verified && (
                          <span className="text-[10px] font-black uppercase text-[#1B5E20] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Verified
                          </span>
                        )}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          supplier.status === 'open' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : supplier.status === 'closing' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            supplier.status === 'open' ? 'bg-emerald-500' : supplier.status === 'closing' ? 'bg-amber-500' : 'bg-gray-400'
                          }`} />
                          {supplier.status === 'open' ? 'Open Now' : supplier.status === 'closing' ? 'Closing Soon' : 'Closed'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Name, Google Verify Button, Address & Rating */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-extrabold text-earth leading-snug">
                          {supplier.name}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyName(supplier);
                          }}
                          disabled={verifyingId === supplier.id}
                          className="p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0 text-gray-400 hover:text-[#1B5E20]"
                          title="Verify official Google Maps shop name"
                        >
                          {verifyingId === supplier.id ? (
                            <Loader2 size={14} className="animate-spin text-[#1B5E20]" />
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 hover:text-[#1B5E20]">
                              Verify
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="truncate">{supplier.address || "Agri Market, District Hub"}</span>
                        <span className="shrink-0 font-bold text-amber-600 flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded">
                          <Star size={12} fill="currentColor" />
                          {supplier.rating} ({supplier.reviews})
                        </span>
                      </div>

                      {/* ETA Badge */}
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 pt-0.5">
                        <span className="flex items-center gap-1 text-[#1B5E20]">
                          <Clock size={12} />
                          ETA ~{etaMinutes} mins drive
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Action Buttons Aligned Bottom-Right */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSupplier(supplier);
                        }}
                        className="text-xs font-bold text-gray-600 hover:text-earth underline decoration-dotted cursor-pointer"
                      >
                        Full Details
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Map Finder Focus Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplier(supplier);
                            setMapFlyTrigger(prev => prev + 1);
                            const mapEl = document.getElementById('map-container');
                            if (mapEl) {
                              mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-emerald-300 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-[#1B5E20] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Locate on Map"
                        >
                          <MapPin size={13} className="text-[#1B5E20]" />
                          <span>Map Finder</span>
                        </button>

                        {/* Call Ghost Button */}
                        <a 
                          href={`tel:${supplier.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Phone size={13} />
                          <span>Call</span>
                        </a>

                        {/* Directions Outlined Accent Button */}
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${
                            supplier.lat && supplier.lng 
                              ? `${supplier.lat},${supplier.lng}`
                              : encodeURIComponent(`${supplier.name}, ${supplier.address || ''}`)
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`Opening Google Maps directions for ${supplier.name}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1B5E20] hover:bg-[#144317] text-white text-xs font-extrabold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Navigation size={13} className="animate-pulse text-emerald-300" />
                          <span>Directions</span>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Expanded Supplier Modal Popup */}
      <AnimatePresence>
        {expandedSupplier && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[2000] bg-white flex flex-col lg:p-6 lg:bg-black/50"
          >
            <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col bg-white lg:rounded-3xl overflow-hidden relative shadow-2xl">
              {/* Modal Map Top Area */}
              <div className="h-[35%] shrink-0 relative bg-gray-200">
                <MapContainer 
                  center={[expandedSupplier.lat || 15.3173, expandedSupplier.lng || 75.7139]} 
                  zoom={16} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[expandedSupplier.lat || 15.3173, expandedSupplier.lng || 75.7139]} icon={selectedIcon}>
                    <Tooltip direction="top" offset={[0, -40]} className="bg-white border-none shadow-md font-bold text-xs px-2.5 py-1 rounded-lg text-earth">
                      {expandedSupplier.name} <span className="text-amber-500 font-bold">★ {expandedSupplier.rating}</span>
                    </Tooltip>
                  </Marker>
                  {latitude && longitude && (
                    <Marker position={[latitude, longitude]} icon={userIcon} />
                  )}
                  {routeCoordinates.length > 0 && (
                    <Polyline positions={routeCoordinates} color="#2E7D32" weight={5} opacity={0.8} />
                  )}
                </MapContainer>
                
                <button 
                  onClick={() => setExpandedSupplier(null)}
                  className="absolute top-4 left-4 z-[3000] bg-white p-2.5 rounded-full shadow-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
              
              {/* Modal Details Section */}
              <div className="flex-1 overflow-y-auto bg-white p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-earth mb-1">{expandedSupplier.name}</h2>
                  <p className="text-xs text-gray-500 font-medium">{expandedSupplier.address}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                      <Star size={13} fill="currentColor" /> {expandedSupplier.rating} ({expandedSupplier.reviews} reviews)
                    </span>
                    <span className="text-xs font-bold text-[#1B5E20] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {expandedSupplier.distance} km away
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & Operating Hours</h3>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone size={16} className="text-[#1B5E20]" />
                      <a href={`tel:${expandedSupplier.phone}`} className="font-bold hover:underline">{expandedSupplier.phone}</a>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock size={16} className="text-[#1B5E20]" />
                      <span className="font-bold">{expandedSupplier.status === 'open' ? 'Open Today 8:00 AM - 6:00 PM' : 'Closed'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                      expandedSupplier.lat && expandedSupplier.lng 
                        ? `${expandedSupplier.lat},${expandedSupplier.lng}`
                        : encodeURIComponent(`${expandedSupplier.name}, ${expandedSupplier.address || ''}`)
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#1B5E20] text-white py-3 rounded-2xl font-black text-xs text-center flex items-center justify-center gap-2 hover:bg-[#144317] transition-colors shadow-md cursor-pointer"
                  >
                    <Navigation size={16} />
                    <span>Get Google Maps Directions</span>
                  </a>
                  <a 
                    href={`tel:${expandedSupplier.phone}`}
                    className="flex-1 border-2 border-gray-200 text-earth py-3 rounded-2xl font-black text-xs text-center flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Phone size={16} />
                    <span>Call Store</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

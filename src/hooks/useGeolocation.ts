import { useState, useCallback, useRef, useEffect } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

// Calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
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

export function useGeolocation(thresholdMeters: number = 5) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });
  const lastLocationRef = useRef<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  const requestLocation = useCallback(() => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        accuracy: null,
        loading: false,
      }));
      return;
    }

    // Fallback timeout in case getCurrentPosition hangs indefinitely
    const fallbackTimeoutId = setTimeout(() => {
      setLocation((prev) => {
        if (prev.loading) {
          return {
            ...prev,
            error: 'Location request timed out or was blocked.',
            accuracy: null,
            loading: false,
          };
        }
        return prev;
      });
    }, 9000);

    const handleSuccess = (position: GeolocationPosition) => {
      clearTimeout(fallbackTimeoutId);
      const { latitude, longitude, accuracy } = position.coords;
      
      const isMoreAccurate = lastLocationRef.current && accuracy < lastLocationRef.current.accuracy;
      
      const distance = lastLocationRef.current 
        ? getDistance(lastLocationRef.current.latitude, lastLocationRef.current.longitude, latitude, longitude)
        : Infinity;

      if (
        !lastLocationRef.current ||
        isMoreAccurate ||
        distance > thresholdMeters
      ) {
        lastLocationRef.current = { latitude, longitude, accuracy };
        setLocation({
          latitude,
          longitude,
          accuracy,
          error: null,
          loading: false,
        });
      } else {
        setLocation(prev => ({ ...prev, accuracy, loading: false }));
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      clearTimeout(fallbackTimeoutId);
      let errorMessage = error.message || 'An unknown error occurred.';
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'Location access denied. Please enable location permissions in your browser.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Location information is unavailable based on current network or GPS.';
          break;
        case 3: // TIMEOUT
          errorMessage = 'The request to get user location timed out. Please try again.';
          break;
      }
      setLocation((prev) => ({
        ...prev,
        error: errorMessage,
        accuracy: null,
        loading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 8000,
    });
  }, [thresholdMeters]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...location, requestLocation };
}

import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CENTER = { lat: 5.3417, lng: -4.0262 }; // Abidjan

/**
 * DeliveryMap
 * - Intégration Google Maps côté client (script chargé dynamiquement)
 * - Choix de lieu via un marker draggable
 * - Retourne { lat, lng, address }
 *
 * IMPORTANT: utiliser une clé Google Maps dans :
 *   - VITE_GOOGLE_MAPS_API_KEY (recommandé)
 */
export default function DeliveryMap({
  value,
  onChange,
  heightClassName = 'h-72',
  className = '',
  markerLabel = '📍',
}) {
  const containerRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const center = useMemo(() => {
    if (value?.lat && value?.lng) return { lat: Number(value.lat), lng: Number(value.lng) };
    return DEFAULT_CENTER;
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    if (!apiKey) return;

    const w = window;
    if (w.google?.maps) {
      setGoogleReady(true);
      return;
    }

    const existing = document.querySelector('script[data-google-maps="1"]');
    if (existing) {
      const t = setInterval(() => {
        if (w.google?.maps) {
          clearInterval(t);
          setGoogleReady(true);
        }
      }, 200);
      return () => clearInterval(t);
    }

    const script = document.createElement('script');
    script.dataset.googleMaps = '1';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    document.head.appendChild(script);

    const onLoad = () => setGoogleReady(true);
    script.addEventListener('load', onLoad);

    return () => {
      script.removeEventListener('load', onLoad);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!googleReady) return;
    if (!containerRef.current) return;

    const map = new window.google.maps.Map(containerRef.current, {
      center,
      zoom: 14,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    });

    const geocoder = new window.google.maps.Geocoder();

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: true,
      title: 'Lieu de livraison',
    });

    const updateAddress = async (lat, lng) => {
      try {
        const results = await geocoder.geocode({ location: { lat, lng } });
        const first = results?.results?.[0];
        const address = first?.formatted_address || '';
        onChange?.({ lat, lng, address });
      } catch {
        onChange?.({ lat, lng, address: '' });
      }
    };

    // Initial
    if (value?.lat && value?.lng) {
      marker.setPosition(center);
      map.panTo(center);
    } else {
      // Sync UI -> parent
      updateAddress(center.lat, center.lng);
    }

    marker.addListener('dragend', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      updateAddress(newLat, newLng);
    });

    map.addListener('click', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      marker.setPosition({ lat: newLat, lng: newLng });
      updateAddress(newLat, newLng);
    });

    return () => {
      // lib : pas de destroy officiel, on laisse GC
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleReady, containerRef, center.lat, center.lng]);

  return (
    <div className={className}>
      {!apiKey ? (
        <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${heightClassName} flex items-center justify-center`}>
          <p className="text-sm text-red-700 font-medium">
            Clé Google Maps manquante : ajoute <span className="font-mono">VITE_GOOGLE_MAPS_API_KEY</span>
          </p>
        </div>
      ) : (
        <div className={`${heightClassName} rounded-xl overflow-hidden border border-[#E8E2D9] bg-gray-100`}>
          {!googleReady && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
          {/* petit label */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-12">
            <div className="text-2xl">{markerLabel}</div>
          </div>
        </div>
      )}
    </div>
  );
}


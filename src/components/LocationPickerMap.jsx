import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '12px',
};

// Default center (Nellore, based on your location)
const defaultCenter = {
  lat: 14.4426,
  lng: 79.9865
};

const libraries = ['places'];

function LocationPickerMap({ center, onLocationChange }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-location-picker',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [markerPosition, setMarkerPosition] = useState(center || defaultCenter);

  // Update marker when center prop changes (e.g., from autocomplete)
  useEffect(() => {
      if (center) {
          setMarkerPosition(center);
      }
  }, [center]);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newPos = { lat, lng };
    setMarkerPosition(newPos);
    onLocationChange(newPos);
  }, [onLocationChange]);
  
  const handleMarkerDragEnd = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const newPos = { lat, lng };
    setMarkerPosition(newPos);
    onLocationChange(newPos);
  }, [onLocationChange]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition || defaultCenter}
      zoom={14}
      onClick={handleMapClick}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <MarkerF
        position={markerPosition || defaultCenter}
        draggable={true}
        onDragEnd={handleMarkerDragEnd}
      />
    </GoogleMap>
  ) : <div>Loading Map...</div>;
}

export default React.memo(LocationPickerMap);
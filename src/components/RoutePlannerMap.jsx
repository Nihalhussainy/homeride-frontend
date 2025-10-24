import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, PolylineF } from '@react-google-maps/api';
import polyline from '@mapbox/polyline'; // You need to install this: npm install @mapbox/polyline

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const center = { lat: 20.5937, lng: 78.9629 };
const libraries = ['places'];

// MODIFIED: This component can now work in two modes:
// 1. With origin/destination (calculates its own route)
// 2. With a pre-calculated polyline (just displays it)
function RoutePlannerMap({ origin, destination, stops, onRouteUpdate, selectedPolyline }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-planner',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [directionsResponse, setDirectionsResponse] = useState(null);

  useEffect(() => {
    // If a polyline is provided, we don't need to calculate directions
    if (selectedPolyline || !isLoaded || !origin || !destination) {
      setDirectionsResponse(null); // Clear any old directions
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const waypoints = (stops || []).filter(stop => stop.trim() !== '').map(stop => ({ location: stop, stopover: true }));

    directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        provideRouteAlternatives: false, // Only need one route here
        travelMode: window.google.maps.TravelMode.DRIVING,
      },(result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
          if(onRouteUpdate) {
            const route = result.routes[0];
            const leg = route.legs.reduce((acc, current) => ({
                distance: acc.distance + current.distance.value,
                duration: acc.duration + current.duration.value,
            }), { distance: 0, duration: 0 });
            onRouteUpdate({
                distance: leg.distance / 1000, // km
                duration: Math.round(leg.duration / 60), // minutes
                polyline: route.overview_polyline,
            });
          }
        } else {
          console.error(`Error fetching directions ${result}`);
        }
      }
    );
  }, [isLoaded, origin, destination, stops, onRouteUpdate, selectedPolyline]);

  // Decode the polyline to draw it on the map
  const decodedPath = React.useMemo(() => {
      if (!selectedPolyline) return [];
      try {
        return polyline.decode(selectedPolyline).map(coords => ({ lat: coords[0], lng: coords[1] }));
      } catch (e) {
        console.error("Error decoding polyline:", e);
        return [];
      }
  }, [selectedPolyline]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={5}
      options={{ zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
      
      {/* NEW: Render a PolylineF if a selectedPolyline is provided */}
      {decodedPath.length > 0 && (
        <PolylineF
            path={decodedPath}
            options={{
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 5,
            }}
        />
      )}
    </GoogleMap>
  ) : <div>Loading Map...</div>;
}

export default React.memo(RoutePlannerMap);
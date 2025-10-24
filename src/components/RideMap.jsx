import React from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, MarkerF } from '@react-google-maps/api';
import { useMemo } from 'react';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const RideMap = ({ ride, stops }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-detail',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const directionsServiceOptions = useMemo(() => {
    return {
      origin: ride.origin,
      destination: ride.destination,
      waypoints: (stops || []).map(stop => ({ location: stop, stopover: true })),
      travelMode: 'DRIVING'
    };
  }, [ride.origin, ride.destination, stops]);

  const [directions, setDirections] = React.useState(null);

  React.useEffect(() => {
    if (isLoaded) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(directionsServiceOptions, (result, status) => {
        if (status === 'OK') {
          setDirections(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      });
    }
  }, [isLoaded, directionsServiceOptions]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={{ lat: 20.5937, lng: 78.9629 }}
      zoom={5}
    >
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  ) : <></>;
};

export default React.memo(RideMap);
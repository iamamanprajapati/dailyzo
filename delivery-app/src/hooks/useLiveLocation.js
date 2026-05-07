import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import { getSocket } from '../api/socket';
import api from '../api/client';

/**
 * Streams the rider's GPS to the backend via Socket.io while on duty.
 * Falls back to REST POST every 15s as a redundancy.
 */
export default function useLiveLocation({ enabled, orderId }) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);
  const lastPostRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          if (Platform.OS !== 'web') {
            Alert.alert('Permission needed', 'Please allow location access to share your route with customers.');
          }
          return;
        }

        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 15, timeInterval: 5_000 },
          (loc) => {
            if (cancelled) return;
            const point = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setCoords(point);

            const socket = getSocket();
            socket.emit('partner:location', { ...point, orderId });

            const now = Date.now();
            if (now - lastPostRef.current > 15_000) {
              lastPostRef.current = now;
              api.post('/delivery/me/location', point).catch(() => {});
            }
          },
        );
        subscriptionRef.current = sub;
      } catch (err) {
        setError(err.message);
      }
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, orderId]);

  return { coords, error };
}

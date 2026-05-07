import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/client';
import { getSocket } from '../api/socket';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';
import { inr, dateTime, statusLabel } from '../utils/format';

let MapView, Marker, Polyline;
if (Platform.OS !== 'web') {
  try {
    const m = require('react-native-maps');
    MapView = m.default;
    Marker = m.Marker;
    Polyline = m.Polyline;
  } catch {}
}

const TIMELINE = [
  { key: 'pending', label: 'Order placed' },
  { key: 'confirmed', label: 'Order confirmed' },
  { key: 'packed', label: 'Items packed' },
  { key: 'assigned', label: 'Rider assigned' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderTrackingScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partnerLoc, setPartnerLoc] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data.order);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('order:subscribe', { orderId });
    const onStatus = () => load();
    const onLoc = ({ lat, lng }) => setPartnerLoc({ lat, lng });
    socket.on('order:status', onStatus);
    socket.on('partner:location', onLoc);
    return () => {
      socket.emit('order:unsubscribe', { orderId });
      socket.off('order:status', onStatus);
      socket.off('partner:location', onLoc);
    };
  }, [orderId]);

  if (loading || !order) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const cancel = async () => {
    Alert.alert('Cancel order?', 'Stock will be restored.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/orders/${orderId}/cancel`, { reason: 'Customer cancelled' });
            load();
          } catch (err) {
            Alert.alert('Failed', err.response?.data?.message);
          }
        },
      },
    ]);
  };

  const currentStep = TIMELINE.findIndex((t) => t.key === order.status);
  const isActive = ['pending', 'confirmed', 'packed', 'assigned', 'out_for_delivery'].includes(order.status);

  const dropLat = order.address?.location?.coordinates?.[1] || 28.535;
  const dropLng = order.address?.location?.coordinates?.[0] || 77.391;
  const riderLat = partnerLoc?.lat || dropLat + 0.01;
  const riderLng = partnerLoc?.lng || dropLng + 0.01;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Map */}
        {MapView ? (
          <View style={styles.mapWrap}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: (riderLat + dropLat) / 2,
                longitude: (riderLng + dropLng) / 2,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
            >
              <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Delivery to" pinColor="green" />
              {isActive && (
                <Marker coordinate={{ latitude: riderLat, longitude: riderLng }} title="Your rider">
                  <View style={styles.bikeMarker}><Text style={{ fontSize: 18 }}>🛵</Text></View>
                </Marker>
              )}
              {isActive && Polyline && (
                <Polyline
                  coordinates={[
                    { latitude: riderLat, longitude: riderLng },
                    { latitude: dropLat, longitude: dropLng },
                  ]}
                  strokeColor={colors.primary}
                  strokeWidth={3}
                />
              )}
            </MapView>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={{ fontSize: 40 }}>🗺️</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Map view available on device</Text>
          </View>
        )}

        <View style={styles.statusCard}>
          <Text style={styles.eta}>
            {order.status === 'delivered' ? '✓ Delivered' : `Arriving in ~${order.deliveryEtaMins || 10} mins`}
          </Text>
          <Text style={styles.orderNo}>{order.orderNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order status</Text>
          {TIMELINE.map((t, i) => {
            const done = i <= currentStep;
            const isCancelled = order.status === 'cancelled' && i > 0;
            return (
              <View key={t.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.dot,
                    done && !isCancelled && { backgroundColor: colors.primary, borderColor: colors.primary },
                    order.status === 'cancelled' && i === 0 && { backgroundColor: colors.danger, borderColor: colors.danger },
                  ]}>
                    {done && !isCancelled && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                  </View>
                  {i < TIMELINE.length - 1 && (
                    <View style={[styles.line, done && !isCancelled && { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: 16 }}>
                  <Text style={[styles.tlLabel, done && !isCancelled && { color: colors.text, fontWeight: '700' }]}>{t.label}</Text>
                  {order.timeline.find((x) => x.key === t.key)?.at && (
                    <Text style={styles.tlTime}>{dateTime(order.timeline.find((x) => x.key === t.key).at)}</Text>
                  )}
                </View>
              </View>
            );
          })}
          {order.status === 'cancelled' && (
            <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 8 }}>
              ✗ Order cancelled · {order.cancelReason}
            </Text>
          )}
        </View>

        {order.deliveryPartner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your delivery partner</Text>
            <View style={styles.partnerCard}>
              <View style={styles.partnerAvatar}><Text style={{ fontSize: 20 }}>🛵</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{order.deliveryPartner.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>{order.deliveryPartner.phone}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemSub}>{it.unit} · Qty {it.quantity}</Text>
              </View>
              <Text style={{ fontWeight: '700' }}>{inr(it.lineTotal)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textMuted }}>Total</Text>
            <Text style={{ fontWeight: '800', fontSize: fontSize.xl }}>{inr(order.total)}</Text>
          </View>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 }}>
            Paid via {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
          </Text>
        </View>

        {isActive && (
          <Button title="Cancel Order" variant="danger" onPress={cancel} style={{ margin: 16 }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { height: 280, backgroundColor: '#dbeafe' },
  mapPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe' },
  bikeMarker: { backgroundColor: '#fff', padding: 6, borderRadius: 999, borderWidth: 2, borderColor: colors.primary },
  statusCard: { backgroundColor: '#fff', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border },
  eta: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary },
  orderNo: { fontFamily: 'monospace', color: colors.textMuted, marginTop: 4 },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { width: 30, alignItems: 'center' },
  dot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.border, marginVertical: 2 },
  tlLabel: { fontSize: fontSize.md, color: colors.textMuted },
  tlTime: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
  partnerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 12, borderRadius: radius.md },
  partnerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontSize: fontSize.md, fontWeight: '500' },
  itemSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

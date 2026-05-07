import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';
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
  { key: 'pending', label: 'Order placed', icon: 'cart' },
  { key: 'confirmed', label: 'Order confirmed', icon: 'checkmark-circle' },
  { key: 'packed', label: 'Items packed', icon: 'cube' },
  { key: 'assigned', label: 'Rider assigned', icon: 'person' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: 'bicycle' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle' },
];

export default function OrderTrackingScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { orderId } = route.params;
  const setUser = useAuth((s) => s.setUser);

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
    const onStatus = async () => {
      load();
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        /* ignore */
      }
    };
    const onLoc = ({ lat, lng }) => setPartnerLoc({ lat, lng });
    socket.on('order:status', onStatus);
    socket.on('partner:location', onLoc);
    return () => {
      socket.emit('order:unsubscribe', { orderId });
      socket.off('order:status', onStatus);
      socket.off('partner:location', onLoc);
    };
  }, [orderId, setUser]);

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
            const { data } = await api.post(`/orders/${orderId}/cancel`, { reason: 'Customer cancelled' });
            if (data.user) setUser(data.user);
            else {
              try {
                const me = await api.get('/auth/me');
                setUser(me.data.user);
              } catch {
                /* ignore */
              }
            }
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
              <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Delivery to">
                <View style={styles.dropMarker}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
              </Marker>
              {isActive && (
                <Marker coordinate={{ latitude: riderLat, longitude: riderLng }} title="Your rider">
                  <View style={styles.bikeMarker}>
                    <MaterialCommunityIcons name="motorbike" size={18} color={colors.primary} />
                  </View>
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
            <MaterialCommunityIcons name="map-outline" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Map view available on device</Text>
          </View>
        )}

        <View style={[styles.statusCard, shadow.card]}>
          <View style={styles.statusIcon}>
            {order.status === 'delivered' ? (
              <Ionicons name="checkmark-done-circle" size={28} color={colors.success} />
            ) : (
              <MaterialCommunityIcons name="clock-fast" size={28} color={colors.primary} />
            )}
          </View>
          <Text style={styles.eta}>
            {order.status === 'delivered' ? 'Delivered' : `Arriving in ~${order.deliveryEtaMins || 10} mins`}
          </Text>
          <Text style={styles.orderNo}>{order.orderNumber}</Text>
        </View>

        <View style={[styles.section, shadow.card]}>
          <Text style={styles.sectionTitle}>Order status</Text>
          {TIMELINE.map((t, i) => {
            const done = i <= currentStep;
            const current = i === currentStep && order.status !== 'delivered';
            const isCancelled = order.status === 'cancelled' && i > 0;
            return (
              <View key={t.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.dot,
                    done && !isCancelled && { backgroundColor: colors.primary, borderColor: colors.primary },
                    current && { backgroundColor: '#fff', borderColor: colors.primary, borderWidth: 3 },
                    order.status === 'cancelled' && i === 0 && { backgroundColor: colors.danger, borderColor: colors.danger },
                  ]}>
                    {done && !isCancelled && !current && <Ionicons name={t.icon} size={11} color="#fff" />}
                    {current && <View style={styles.pulseDot} />}
                  </View>
                  {i < TIMELINE.length - 1 && (
                    <View style={[styles.line, done && !isCancelled && { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: 18 }}>
                  <Text style={[styles.tlLabel, done && !isCancelled && { color: colors.text, fontWeight: '700' }]}>{t.label}</Text>
                  {order.timeline.find((x) => x.key === t.key)?.at && (
                    <Text style={styles.tlTime}>{dateTime(order.timeline.find((x) => x.key === t.key).at)}</Text>
                  )}
                </View>
              </View>
            );
          })}
          {order.status === 'cancelled' && (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={styles.cancelledText}>Order cancelled · {order.cancelReason}</Text>
            </View>
          )}
        </View>

        {order.deliveryPartner && (
          <View style={[styles.section, shadow.card]}>
            <Text style={styles.sectionTitle}>Your delivery partner</Text>
            <View style={styles.partnerCard}>
              <View style={styles.partnerAvatar}>
                <MaterialCommunityIcons name="motorbike" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>{order.deliveryPartner.name}</Text>
                <Text style={styles.partnerPhone}>{order.deliveryPartner.phone}</Text>
              </View>
              <View style={styles.partnerCallBox}>
                <Ionicons name="call" size={18} color={colors.primary} />
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, shadow.card]}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemSub}>{it.unit} · Qty {it.quantity}</Text>
              </View>
              <Text style={{ fontWeight: '800' }}>{inr(it.lineTotal)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>TOTAL</Text>
            <Text style={{ fontWeight: '800', fontSize: fontSize.xl }}>{inr(order.total)}</Text>
          </View>
          <View style={styles.payInfoRow}>
            <Ionicons name="card" size={12} color={colors.textMuted} />
            <Text style={styles.payInfoText}>
              Paid via {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
            </Text>
          </View>
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
  bikeMarker: { backgroundColor: '#fff', padding: 8, borderRadius: 999, borderWidth: 2, borderColor: colors.primary },
  dropMarker: { backgroundColor: colors.danger, padding: 8, borderRadius: 999, borderWidth: 2, borderColor: '#fff' },
  statusCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: -32,
    padding: 18, borderRadius: radius.lg, alignItems: 'center',
  },
  statusIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  eta: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  orderNo: { color: colors.textMuted, marginTop: 4, fontWeight: '700' },
  section: {
    backgroundColor: '#fff', padding: 16, marginTop: 12, marginHorizontal: 12,
    borderRadius: radius.lg,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', marginBottom: 14, color: colors.text },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { width: 32, alignItems: 'center' },
  dot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.border, marginVertical: 2 },
  tlLabel: { fontSize: fontSize.md, color: colors.textMuted },
  tlTime: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fee2e2', padding: 10, borderRadius: radius.md, marginTop: 8,
  },
  cancelledText: { color: colors.danger, fontWeight: '700' },
  partnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, padding: 12, borderRadius: radius.md,
  },
  partnerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  partnerName: { fontWeight: '800', color: colors.text },
  partnerPhone: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  partnerCallBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { fontSize: fontSize.md, fontWeight: '600' },
  itemSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  payInfoText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
});

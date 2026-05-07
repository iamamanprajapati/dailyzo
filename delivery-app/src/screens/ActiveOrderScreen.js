import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Pressable, Linking, Platform, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/client';
import { getSocket } from '../api/socket';
import { useDuty } from '../store/duty';
import useLiveLocation from '../hooks/useLiveLocation';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr, formatDistance, distanceMeters } from '../utils/format';

let MapView, Marker, Polyline;
if (Platform.OS !== 'web') {
  try {
    const m = require('react-native-maps');
    MapView = m.default;
    Marker = m.Marker;
    Polyline = m.Polyline;
  } catch {}
}

const STAGES = [
  { from: 'assigned', to: 'out_for_delivery', label: 'Picked up · Start ride', emoji: '🚀' },
  { from: 'out_for_delivery', to: 'delivered', label: 'Mark as Delivered', emoji: '✅' },
];

export default function ActiveOrderScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { isOnDuty } = useDuty();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const orderIdParam = route.params?.orderId;

  const { coords } = useLiveLocation({ enabled: isOnDuty && !!order, orderId: order?._id });

  const load = async () => {
    try {
      const { data } = orderIdParam
        ? await api.get(`/orders/${orderIdParam}`)
        : await api.get('/orders/delivery/active');
      setOrder(data.order);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const onStatus = () => load();
    socket.on('order:status', onStatus);
    return () => socket.off('order:status', onStatus);
  }, [orderIdParam]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  if (!order) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 60 }}>🛵</Text>
        <Text style={styles.emptyText}>No active order</Text>
        <Text style={styles.emptySub}>Toggle "On duty" on the home screen to start receiving orders.</Text>
        <Button title="Go to Home" onPress={() => nav.navigate('HomeTab')} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const dropLat = order.address?.location?.coordinates?.[1] || 28.535;
  const dropLng = order.address?.location?.coordinates?.[0] || 77.391;
  const myLat = coords?.lat ?? dropLat + 0.01;
  const myLng = coords?.lng ?? dropLng + 0.01;
  const distance = coords ? distanceMeters({ lat: myLat, lng: myLng }, { lat: dropLat, lng: dropLng }) : null;

  const stage = STAGES.find((s) => s.from === order.status);

  const advance = async () => {
    if (!stage) return;
    setBusy(true);
    try {
      await api.patch(`/orders/${order._id}/status`, { status: stage.to });
      await load();
      if (stage.to === 'delivered') {
        Alert.alert('🎉 Delivered!', 'Great job! You earned ₹30 on this delivery.');
        nav.navigate('HomeTab');
      }
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const callCustomer = () => {
    if (!order.user?.phone) return;
    Linking.openURL(`tel:${order.user.phone}`);
  };

  const navigateToDrop = () => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${dropLat},${dropLng}`,
      android: `google.navigation:q=${dropLat},${dropLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`,
    });
    Linking.openURL(url).catch(() => Alert.alert('Could not open maps'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {MapView ? (
          <View style={styles.mapWrap}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: (myLat + dropLat) / 2,
                longitude: (myLng + dropLng) / 2,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
              showsUserLocation
              followsUserLocation
            >
              <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Drop point">
                <View style={styles.dropMarker}><Text style={{ fontSize: 18 }}>📍</Text></View>
              </Marker>
              {Polyline && (
                <Polyline
                  coordinates={[
                    { latitude: myLat, longitude: myLng },
                    { latitude: dropLat, longitude: dropLng },
                  ]}
                  strokeColor={colors.primary}
                  strokeWidth={4}
                />
              )}
            </MapView>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={{ fontSize: 40 }}>🗺️</Text>
            <Text style={{ color: colors.textMuted }}>Map available on device</Text>
          </View>
        )}

        <View style={[styles.statusCard, shadow.card]}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.orderNo}>{order.orderNumber}</Text>
          <Text style={styles.distLine}>
            {distance !== null ? `📍 ${formatDistance(distance)} to drop` : 'Calculating distance…'}
          </Text>
          {!isOnDuty && (
            <Text style={styles.warnText}>⚠️ You're OFF duty — turn on duty for live tracking</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{order.user?.name?.[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.user?.name}</Text>
              <Text style={styles.customerPhone}>{order.user?.phone}</Text>
            </View>
            <Pressable onPress={callCustomer} style={styles.callBtn}>
              <Text style={{ fontSize: 22 }}>📞</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drop address</Text>
          <View style={styles.addrCard}>
            <Text style={styles.addrLabel}>{order.address?.label || 'Home'}</Text>
            <Text style={styles.addrText}>{order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}</Text>
            <Text style={styles.addrText}>{order.address?.city}, {order.address?.state} {order.address?.pincode}</Text>
            {order.address?.landmark && <Text style={styles.addrText}>Landmark: {order.address.landmark}</Text>}
          </View>
          <Button title="🗺  Navigate" variant="outline" onPress={navigateToDrop} style={{ marginTop: 8 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemSub}>{it.unit}</Text>
              </View>
              <Text style={styles.itemQty}>× {it.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.payLabel}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Already paid online'}</Text>
            <Text style={styles.payAmount}>{inr(order.total)}</Text>
          </View>
          {order.paymentMethod === 'cod' && (
            <Text style={styles.codHint}>💵 Collect ₹{Math.round(order.total)} from customer</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {stage ? (
          <Button
            title={`${stage.emoji}  ${stage.label}`}
            onPress={advance}
            loading={busy}
          />
        ) : (
          <Button title="✓ Delivered" disabled />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  mapWrap: { height: 280, backgroundColor: '#dbeafe' },
  mapPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe' },
  dropMarker: { backgroundColor: '#fff', padding: 8, borderRadius: 999, borderWidth: 2, borderColor: colors.danger },
  statusCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -40, padding: 16, borderRadius: radius.xl, alignItems: 'center' },
  statusBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { color: '#fff', fontWeight: '800', fontSize: fontSize.xs, letterSpacing: 1 },
  orderNo: { fontFamily: 'monospace', fontWeight: '700', fontSize: fontSize.lg, marginTop: 8 },
  distLine: { color: colors.textMuted, marginTop: 4 },
  warnText: { color: colors.warning, marginTop: 6, fontSize: fontSize.xs, fontWeight: '700' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: radius.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  customerCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  customerName: { fontWeight: '700', fontSize: fontSize.md },
  customerPhone: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  addrCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: radius.md },
  addrLabel: { fontWeight: '700', color: colors.text },
  addrText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border },
  itemName: { fontSize: fontSize.md, fontWeight: '500' },
  itemSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  itemQty: { fontWeight: '800', fontSize: fontSize.md, color: colors.primary },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payLabel: { fontSize: fontSize.md, fontWeight: '600' },
  payAmount: { fontSize: fontSize.xl, fontWeight: '800' },
  codHint: { color: colors.warning, marginTop: 8, fontSize: fontSize.sm, fontWeight: '700' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
});

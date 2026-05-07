import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Pressable, Linking, Platform, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  { from: 'assigned', to: 'out_for_delivery', label: 'Picked up · Start ride', icon: 'rocket' },
  { from: 'out_for_delivery', to: 'delivered', label: 'Mark as Delivered', icon: 'checkmark-done' },
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
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="motorbike" size={48} color={colors.primary} />
        </View>
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
        Alert.alert('Delivered!', 'Great job! You earned ₹30 on this delivery.');
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
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
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
                <View style={styles.dropMarker}>
                  <Ionicons name="location" size={18} color="#fff" />
                </View>
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
            <MaterialCommunityIcons name="map-outline" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }}>Map available on device</Text>
          </View>
        )}

        <View style={[styles.statusCard, shadow.card]}>
          <View style={styles.statusBadge}>
            <View style={styles.dotPulse} />
            <Text style={styles.statusBadgeText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.orderNo}>{order.orderNumber}</Text>
          <View style={styles.distRow}>
            <Ionicons name="navigate" size={14} color={colors.textMuted} />
            <Text style={styles.distLine}>
              {distance !== null ? `${formatDistance(distance)} to drop` : 'Calculating distance…'}
            </Text>
          </View>
          {!isOnDuty && (
            <View style={styles.warnRow}>
              <Ionicons name="warning" size={14} color={colors.warning} />
              <Text style={styles.warnText}>You're OFF duty — turn on for live tracking</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, shadow.card]}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{order.user?.name?.[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order.user?.name}</Text>
              <View style={styles.customerPhoneRow}>
                <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                <Text style={styles.customerPhone}>{order.user?.phone}</Text>
              </View>
            </View>
            <Pressable onPress={callCustomer} style={styles.callBtn}>
              <Ionicons name="call" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, shadow.card]}>
          <Text style={styles.sectionTitle}>Drop address</Text>
          <View style={styles.addrCard}>
            <View style={styles.addrLabelRow}>
              <Ionicons
                name={order.address?.label?.toLowerCase() === 'work' ? 'briefcase' : 'home'}
                size={14} color={colors.primary}
              />
              <Text style={styles.addrLabel}>{order.address?.label || 'Home'}</Text>
            </View>
            <Text style={styles.addrText}>{order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}</Text>
            <Text style={styles.addrText}>{order.address?.city}, {order.address?.state} {order.address?.pincode}</Text>
            {order.address?.landmark && (
              <Text style={styles.addrLandmark}>📍 Landmark: {order.address.landmark}</Text>
            )}
          </View>
          <Pressable onPress={navigateToDrop} style={styles.navBtn}>
            <Ionicons name="navigate-circle" size={20} color="#fff" />
            <Text style={styles.navBtnText}>Open in Maps</Text>
          </Pressable>
        </View>

        <View style={[styles.section, shadow.card]}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((it, i) => (
            <View key={i} style={[styles.itemRow, i === order.items.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemSub}>{it.unit}</Text>
              </View>
              <View style={styles.qtyChip}>
                <Text style={styles.itemQty}>× {it.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, shadow.card]}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <View style={styles.payIconBox}>
              <Ionicons
                name={order.paymentMethod === 'cod' ? 'cash' : 'card'}
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.payLabel}>
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Already paid online'}
            </Text>
            <Text style={styles.payAmount}>{inr(order.total)}</Text>
          </View>
          {order.paymentMethod === 'cod' && (
            <View style={styles.codBanner}>
              <Ionicons name="information-circle" size={14} color={colors.warning} />
              <Text style={styles.codHint}>Collect ₹{Math.round(order.total)} from customer</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {stage ? (
          <Pressable
            onPress={advance}
            disabled={busy}
            style={({ pressed }) => [styles.actionBtn, shadow.glow, (pressed || busy) && { opacity: 0.85 }]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={stage.icon} size={20} color="#fff" />
                <Text style={styles.actionBtnText}>{stage.label}</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Button title="Delivered" disabled />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: fontSize.xl, fontWeight: '800', marginTop: 8, color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  mapWrap: { height: 280, backgroundColor: '#dbeafe' },
  mapPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbeafe' },
  dropMarker: { backgroundColor: colors.danger, padding: 10, borderRadius: 999, borderWidth: 2, borderColor: '#fff' },
  statusCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: -40,
    padding: 16, borderRadius: radius.xl, alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  statusBadgeText: { color: '#fff', fontWeight: '800', fontSize: fontSize.xs, letterSpacing: 1 },
  dotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  orderNo: { fontWeight: '800', fontSize: fontSize.lg, marginTop: 10, color: colors.text },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distLine: { color: colors.textMuted, fontWeight: '600' },
  warnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#fef3c7', borderRadius: radius.sm,
  },
  warnText: { color: colors.warning, fontSize: fontSize.xs, fontWeight: '700' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: radius.lg },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  customerCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  customerName: { fontWeight: '800', fontSize: fontSize.md, color: colors.text },
  customerPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  customerPhone: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  callBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadow.glow,
  },
  addrCard: { backgroundColor: '#f8fafc', padding: 14, borderRadius: radius.md },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  addrLabel: { fontWeight: '800', color: colors.text },
  addrText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  addrLandmark: { color: colors.warning, fontSize: fontSize.sm, marginTop: 6, fontWeight: '600' },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12, borderRadius: radius.md, marginTop: 10,
  },
  navBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
  itemName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  itemSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  qtyChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.sm, backgroundColor: colors.primarySoft,
  },
  itemQty: { fontWeight: '800', fontSize: fontSize.sm, color: colors.primary },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  payLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  payAmount: { fontSize: fontSize.xl, fontWeight: '800' },
  codBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef3c7', padding: 10, borderRadius: radius.md, marginTop: 10,
  },
  codHint: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '700' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16, borderRadius: radius.md,
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSize.lg },
});

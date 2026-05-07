import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr, dateTime, statusLabel } from '../utils/format';
import { useAuth } from '../store/auth';

const statusColor = {
  pending: { bg: '#fef3c7', fg: '#92400e', icon: 'time-outline' },
  confirmed: { bg: '#dbeafe', fg: '#1e40af', icon: 'checkmark-circle-outline' },
  packed: { bg: '#e0e7ff', fg: '#3730a3', icon: 'cube-outline' },
  assigned: { bg: '#f3e8ff', fg: '#6b21a8', icon: 'person-outline' },
  out_for_delivery: { bg: '#cffafe', fg: '#155e75', icon: 'bicycle' },
  delivered: { bg: '#d1fae5', fg: '#065f46', icon: 'checkmark-done-circle' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b', icon: 'close-circle' },
};

export default function OrdersScreen() {
  const nav = useNavigation();
  const user = useAuth((s) => s.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await api.get('/orders/me');
      setOrders(data.orders);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="receipt-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>Sign in to see your orders</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>{orders.length} orders so far</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const sc = statusColor[item.status] || statusColor.pending;
          const active = ['pending', 'confirmed', 'packed', 'assigned', 'out_for_delivery'].includes(item.status);
          return (
            <Pressable
              style={({ pressed }) => [styles.card, shadow.card, pressed && { transform: [{ scale: 0.99 }] }]}
              onPress={() => nav.navigate('OrderTracking', { orderId: item._id })}
            >
              <View style={styles.row1}>
                <View style={styles.brandBadge}>
                  <MaterialCommunityIcons name="lightning-bolt" size={11} color={colors.primary} />
                  <Text style={styles.brandBadgeText}>10 min</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Ionicons name={sc.icon} size={11} color={sc.fg} />
                  <Text style={[styles.statusText, { color: sc.fg }]}>{statusLabel(item.status)}</Text>
                </View>
              </View>

              <View style={styles.imagesRow}>
                {item.items.slice(0, 4).map((it, i) => (
                  it.image ? (
                    <Image key={i} source={{ uri: it.image }} style={styles.thumb} />
                  ) : (
                    <View key={i} style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="image-outline" size={18} color={colors.textLight} />
                    </View>
                  )
                ))}
                {item.items.length > 4 && (
                  <View style={styles.moreCount}>
                    <Text style={styles.moreCountText}>+{item.items.length - 4}</Text>
                  </View>
                )}
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNo}>{item.orderNumber}</Text>
                  <Text style={styles.dateText}>
                    {item.status === 'delivered' && item.deliveredAt
                      ? `Delivered · ${dateTime(item.deliveredAt)}`
                      : `Placed · ${dateTime(item.createdAt)}`}
                  </Text>
                </View>
                <Text style={styles.total}>{inr(item.total)}</Text>
              </View>

              {active && (
                <View style={styles.trackBtn}>
                  <Ionicons name="navigate-circle" size={16} color={colors.primary} />
                  <Text style={styles.trackBtnText}>Track order</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </View>
              )}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySub}>Your orders will show up here</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: colors.border },
  title: { fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  brandBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  brandBadgeText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.xs },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  statusText: { fontWeight: '700', fontSize: fontSize.xs, textTransform: 'capitalize' },
  imagesRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  thumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: colors.surface },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  moreCount: {
    width: 50, height: 50, borderRadius: 10, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  moreCountText: { color: colors.textMuted, fontWeight: '700' },
  row2: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 },
  orderNo: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  dateText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  total: { fontSize: fontSize.lg, fontWeight: '800' },
  trackBtn: {
    marginTop: 10, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  trackBtnText: { color: colors.primary, fontWeight: '800', flex: 1, textAlign: 'center' },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, fontSize, radius } from '../theme';
import { inr, dateTime, statusLabel } from '../utils/format';
import { useAuth } from '../store/auth';

const statusColor = {
  pending: { bg: '#fef3c7', fg: '#92400e' },
  confirmed: { bg: '#dbeafe', fg: '#1e40af' },
  packed: { bg: '#e0e7ff', fg: '#3730a3' },
  assigned: { bg: '#f3e8ff', fg: '#6b21a8' },
  out_for_delivery: { bg: '#cffafe', fg: '#155e75' },
  delivered: { bg: '#d1fae5', fg: '#065f46' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
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
        <Text style={{ fontSize: 60, marginBottom: 16 }}>📦</Text>
        <Text style={styles.emptyText}>Sign in to see your orders</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
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
              style={styles.card}
              onPress={() => nav.navigate('OrderTracking', { orderId: item._id })}
            >
              <View style={styles.row1}>
                <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>D now</Text></View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.fg }]}>{statusLabel(item.status)}</Text>
                </View>
              </View>

              <View style={styles.imagesRow}>
                {item.items.slice(0, 4).map((it, i) => (
                  it.image ? <Image key={i} source={{ uri: it.image }} style={styles.thumb} /> : <View key={i} style={styles.thumbPlaceholder} />
                ))}
                {item.items.length > 4 && <View style={styles.moreCount}><Text style={styles.moreCountText}>+{item.items.length - 4}</Text></View>}
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
                  <Text style={styles.trackBtnText}>Track order  →</Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 60, marginBottom: 16 }}>📦</Text>
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
  card: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  row1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  brandBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  brandBadgeText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.xs },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: fontSize.xs, textTransform: 'capitalize' },
  imagesRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface },
  thumbPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface },
  moreCount: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  moreCountText: { color: colors.textMuted, fontWeight: '700' },
  row2: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 },
  orderNo: { fontSize: fontSize.sm, fontWeight: '700', fontFamily: 'monospace' },
  dateText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  total: { fontSize: fontSize.lg, fontWeight: '800' },
  trackBtn: { marginTop: 10, padding: 10, backgroundColor: colors.primarySoft, borderRadius: radius.md, alignItems: 'center' },
  trackBtnText: { color: colors.primary, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});

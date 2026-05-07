import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr, dateTime } from '../utils/format';

export default function HistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    try {
      const [{ data: orderData }, { data: profileData }] = await Promise.all([
        api.get('/orders/delivery/history'),
        api.get('/delivery/me'),
      ]);
      setOrders(orderData.orders);
      setProfile(profileData.partner);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const week = new Date(today);
    week.setDate(week.getDate() - 6);

    const delivered = orders.filter((o) => o.status === 'delivered');
    const todayCount = delivered.filter((o) => new Date(o.deliveredAt) >= today).length;
    const weekCount = delivered.filter((o) => new Date(o.deliveredAt) >= week).length;

    return { todayCount, weekCount, totalCount: profile?.completedOrders || 0, totalEarnings: profile?.earnings || 0 };
  }, [orders, profile]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <LinearGradient colors={[colors.bg, '#1e293b']} style={styles.header}>
        <Text style={styles.title}>Earnings & History</Text>
        <View style={styles.earningsRow}>
          <View>
            <Text style={styles.earningsValue}>{inr(stats.totalEarnings)}</Text>
            <Text style={styles.earningsLabel}>Total earnings</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.earningsValue}>{stats.totalCount}</Text>
            <Text style={styles.earningsLabel}>Total deliveries</Text>
          </View>
        </View>

        <View style={[styles.miniStats, shadow.big]}>
          <Mini label="Today" value={stats.todayCount} />
          <View style={styles.divider} />
          <Mini label="This week" value={stats.weekCount} />
          <View style={styles.divider} />
          <Mini label="Rating" value={`${profile?.rating?.toFixed(1) || '—'} ⭐`} />
        </View>
      </LinearGradient>

      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 12, paddingTop: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderNo}>{item.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'delivered' ? '#d1fae5' : '#fee2e2' }]}>
                <Text style={[styles.statusText, { color: item.status === 'delivered' ? '#065f46' : '#991b1b' }]}>
                  {item.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                </Text>
              </View>
            </View>
            <Text style={styles.itemSummary}>{item.items.length} items · {inr(item.total)}</Text>
            <Text style={styles.dateText}>{dateTime(item.deliveredAt || item.cancelledAt || item.createdAt)}</Text>
            {item.status === 'delivered' && (
              <Text style={styles.earned}>+ ₹30 earned</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 50 }}>📦</Text>
            <Text style={styles.emptyText}>No deliveries yet</Text>
            <Text style={styles.emptySub}>Your completed orders will show up here</Text>
          </View>
        }
      />
    </View>
  );
}

const Mini = ({ label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.text }}>{value}</Text>
    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 50 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff' },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  earningsValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  earningsLabel: { fontSize: fontSize.xs, color: colors.textMutedDark, marginTop: 2 },
  miniStats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.lg, marginTop: 18, paddingVertical: 14 },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: radius.lg, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontFamily: 'monospace', fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: fontSize.xs },
  itemSummary: { fontSize: fontSize.md, fontWeight: '600', marginTop: 8 },
  dateText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  earned: { color: colors.success, fontWeight: '700', marginTop: 6, fontSize: fontSize.sm },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4 },
});

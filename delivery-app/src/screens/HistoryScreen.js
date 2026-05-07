import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <LinearGradient colors={[colors.bg, '#1e293b']} style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons name="trending-up" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>Earnings & History</Text>
        </View>

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
          <Mini icon="today-outline" label="Today" value={stats.todayCount} />
          <View style={styles.divider} />
          <Mini icon="calendar-outline" label="This week" value={stats.weekCount} />
          <View style={styles.divider} />
          <Mini icon="star" label="Rating" value={`${profile?.rating?.toFixed(1) || '—'}`} />
        </View>
      </LinearGradient>

      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 12, paddingTop: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const isDelivered = item.status === 'delivered';
          return (
            <View style={[styles.card, shadow.card]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIconBox, { backgroundColor: isDelivered ? colors.primarySoft : '#fee2e2' }]}>
                    <Ionicons
                      name={isDelivered ? 'checkmark-done' : 'close'}
                      size={18}
                      color={isDelivered ? colors.primary : colors.danger}
                    />
                  </View>
                  <View>
                    <Text style={styles.orderNo}>{item.orderNumber}</Text>
                    <Text style={styles.dateText}>{dateTime(item.deliveredAt || item.cancelledAt || item.createdAt)}</Text>
                  </View>
                </View>
                {isDelivered && (
                  <View style={styles.earnedPill}>
                    <Ionicons name="cash" size={12} color={colors.success} />
                    <Text style={styles.earned}>+ ₹30</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemRow}>
                <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                <Text style={styles.itemSummary}>
                  {item.items.length} items · {inr(item.total)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>No deliveries yet</Text>
            <Text style={styles.emptySub}>Your completed orders will show up here</Text>
          </View>
        }
      />
    </View>
  );
}

const Mini = ({ icon, label, value }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Ionicons name={icon} size={16} color={colors.primary} />
    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: 4 }}>{value}</Text>
    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 56 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.primarySoft + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  earningsValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  earningsLabel: { fontSize: fontSize.xs, color: colors.textMutedDark, marginTop: 2 },
  miniStats: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: radius.lg, marginTop: 18, paddingVertical: 14,
  },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: radius.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  orderNo: { fontWeight: '800', color: colors.text },
  dateText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  earnedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  earned: { color: colors.success, fontWeight: '800', fontSize: fontSize.sm },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border,
  },
  itemSummary: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4 },
});

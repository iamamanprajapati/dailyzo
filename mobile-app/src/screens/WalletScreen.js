import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import { useAuth } from '../store/auth';
import { colors, fontSize, radius, shadow } from '../theme';

export default function WalletScreen() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const balance = user?.walletBalance ?? 0;
  const [refreshing, setRefreshing] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      /* ignore */
    }
  }, [setUser]);

  const fetchWalletActivity = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/transactions', { params: { wallet: true } });
      setActivity(Array.isArray(data.transactions) ? data.transactions : []);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshProfile(), fetchWalletActivity()]);
  }, [refreshProfile, fetchWalletActivity]);

  useFocusEffect(
    useCallback(() => {
      setActivityLoading(true);
      refreshAll();
    }, [refreshAll]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={[styles.balanceCard, shadow.card]}>
          <View style={styles.balanceTop}>
            <MaterialCommunityIcons name="wallet" size={28} color={colors.primaryDark} />
            <Text style={styles.balanceLabel}>Dailyzo Wallet</Text>
          </View>
          <Text style={styles.balanceValue}>₹{balance}</Text>
          <Text style={styles.balanceHint}>Pay securely from this balance at checkout.</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick info</Text>
        <View style={[styles.rowCard, shadow.card]}>
          <Row icon="flash-outline" title="Instant refunds" subtitle="Credited to wallet when orders are cancelled." />
          <View style={styles.divider} />
          <Row icon="gift-outline" title="Rewards" subtitle="Earn cashback on select promotions." />
          <View style={styles.divider} />
          <Row icon="shield-checkmark-outline" title="Secure" subtitle="Balance is tied to your verified phone number." />
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        {activityLoading && activity.length === 0 ? (
          <View style={[styles.loadingActivity, shadow.card]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingHint}>Loading activity…</Text>
          </View>
        ) : activity.length === 0 ? (
          <View style={[styles.emptyActivity, shadow.card]}>
            <Ionicons name="receipt-outline" size={36} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Wallet charges and credits will appear here.</Text>
          </View>
        ) : (
          <View style={[styles.activityCard, shadow.card]}>
            {activity.map((t, index) => (
              <ActivityRow key={t._id || index} txn={t} isLast={index === activity.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, title, subtitle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function activityTitle(txn) {
  if (txn.type === 'wallet_debit') return 'Paid from wallet';
  if (txn.type === 'wallet_credit') {
    if (txn.meta?.reason === 'order_cancelled') return 'Refund · order cancelled';
    return 'Credited to wallet';
  }
  return 'Wallet';
}

function ActivityRow({ txn, isLast }) {
  const credit = txn.type === 'wallet_credit';
  const orderNumber = txn.order?.orderNumber;
  const when = txn.createdAt
    ? new Date(txn.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '';
  const sub = [orderNumber ? `#${orderNumber}` : null, when].filter(Boolean).join(' · ');

  return (
    <View style={[styles.txnRow, !isLast && styles.txnRowBorder]}>
      <View style={[styles.txnIconWrap, credit ? styles.txnIconCredit : styles.txnIconDebit]}>
        <Ionicons
          name={credit ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={22}
          color={credit ? '#059669' : colors.primaryDark}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.txnTitle} numberOfLines={2}>
          {activityTitle(txn)}
        </Text>
        {!!sub && (
          <Text style={styles.txnSub} numberOfLines={2}>
            {sub}
          </Text>
        )}
      </View>
      <Text style={[styles.txnAmount, credit ? styles.txnAmountCredit : styles.txnAmountDebit]}>
        {credit ? '+' : '−'}₹{txn.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 12, paddingBottom: 32 },
  balanceCard: {
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 20,
  },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  balanceValue: { fontSize: 36, fontWeight: '800', color: colors.primaryDark, marginTop: 8, letterSpacing: -1 },
  balanceHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 8, fontWeight: '600' },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  rowCard: { backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
  loadingActivity: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  loadingHint: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  emptyActivity: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: 10 },
  emptySub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  activityCard: { backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden' },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  txnRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  txnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnIconCredit: { backgroundColor: '#d1fae5' },
  txnIconDebit: { backgroundColor: colors.primarySoft },
  txnTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  txnSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3 },
  txnAmount: { fontSize: fontSize.md, fontWeight: '800', marginLeft: 8 },
  txnAmountCredit: { color: '#059669' },
  txnAmountDebit: { color: colors.text },
});

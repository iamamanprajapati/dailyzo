import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from '../store/auth';
import { useDuty } from '../store/duty';
import useLiveLocation from '../hooks/useLiveLocation';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr, dateShort } from '../utils/format';

export default function HomeScreen() {
  const nav = useNavigation();
  const user = useAuth((s) => s.user);
  const { isOnDuty, isAvailable, setDuty, setAvailable } = useDuty();
  const [profile, setProfile] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useLiveLocation({ enabled: isOnDuty });

  const load = useCallback(async () => {
    try {
      const [{ data: meData }, { data: orderData }] = await Promise.all([
        api.get('/delivery/me'),
        api.get('/orders/delivery/active'),
      ]);
      setProfile(meData.partner);
      setActiveOrder(orderData.order);
      if (meData.partner) {
        setDuty(!!meData.partner.isOnDuty);
        setAvailable(!!meData.partner.isAvailable);
      }
    } catch {}
    setRefreshing(false);
  }, [setDuty, setAvailable]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    const socket = getSocket();
    const onAssign = ({ orderId }) => {
      Alert.alert('🚀 New order!', 'A new order has been assigned to you.', [
        { text: 'View', onPress: () => nav.navigate('ActiveOrder', { orderId }) },
      ]);
      load();
    };
    socket.on('order:assigned', onAssign);
    return () => socket.off('order:assigned', onAssign);
  }, [nav, load]);

  const toggleDuty = async (next) => {
    setDuty(next);
    try {
      await api.post('/delivery/me/availability', { isOnDuty: next, isAvailable: next });
      setAvailable(next);
    } catch {
      Alert.alert('Failed to update', 'Try again.');
      setDuty(!next);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <LinearGradient colors={[colors.bg, '#1e293b']} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greet}>Hey, {user?.name?.split(' ')[0]} 👋</Text>
              <Text style={styles.heroSub}>{dateShort(new Date())} · Ready to ride?</Text>
            </View>
            <Pressable style={styles.profileBtn} onPress={() => nav.navigate('Profile')}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase()}</Text>
            </Pressable>
          </View>

          <View style={[styles.dutyCard, shadow.big]}>
            <View>
              <Text style={styles.dutyTitle}>{isOnDuty ? 'You are ON DUTY' : 'Currently OFF DUTY'}</Text>
              <Text style={styles.dutySub}>
                {isOnDuty
                  ? isAvailable ? 'Looking for orders nearby…' : 'Busy with active order'
                  : 'Toggle on to start receiving orders'}
              </Text>
            </View>
            <Switch
              value={isOnDuty}
              onValueChange={toggleDuty}
              trackColor={{ false: '#475569', true: colors.primary }}
              thumbColor="#fff"
              ios_backgroundColor="#475569"
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </View>
        </LinearGradient>

        {activeOrder && (
          <Pressable style={[styles.activeCard, shadow.card]} onPress={() => nav.navigate('ActiveOrder', { orderId: activeOrder._id })}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>📍 ACTIVE ORDER</Text>
            </View>
            <Text style={styles.activeOrderNo}>{activeOrder.orderNumber}</Text>
            <Text style={styles.activeCustomer}>For {activeOrder.user?.name}</Text>
            <View style={styles.activeMeta}>
              <Text style={styles.activeMetaText}>{activeOrder.items.length} items</Text>
              <Text style={styles.activeMetaText}>·</Text>
              <Text style={styles.activeMetaText}>{inr(activeOrder.total)}</Text>
              <Text style={styles.activeMetaText}>·</Text>
              <Text style={[styles.activeMetaText, { color: colors.primary, fontWeight: '700' }]}>
                {activeOrder.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={styles.viewBtn}>Open delivery  →</Text>
          </Pressable>
        )}

        <View style={styles.statsGrid}>
          <Stat icon="📦" label="Total Deliveries" value={profile?.completedOrders || 0} />
          <Stat icon="💰" label="Total Earnings" value={inr(profile?.earnings || 0)} />
          <Stat icon="⭐" label="Rating" value={`${profile?.rating?.toFixed(1) || '—'}`} />
          <Stat icon="🛵" label="Vehicle" value={profile?.vehicleNumber || '—'} small />
        </View>

        <Pressable style={styles.menuCard} onPress={() => nav.navigate('History')}>
          <Text style={styles.menuIcon}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Order history & earnings</Text>
            <Text style={styles.menuSub}>Track your past deliveries</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={styles.menuCard} onPress={() => nav.navigate('Profile')}>
          <Text style={styles.menuIcon}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Profile & vehicle</Text>
            <Text style={styles.menuSub}>{profile?.vehicleType?.toUpperCase() || 'Bike'} · {profile?.vehicleNumber}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const Stat = ({ icon, label, value, small }) => (
  <View style={styles.statCard}>
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text style={[styles.statValue, small && { fontSize: fontSize.md }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  hero: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 80 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greet: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: fontSize.sm, color: colors.textMutedDark, marginTop: 2 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  dutyCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 24,
  },
  dutyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  dutySub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  activeCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -60, borderRadius: radius.xl, padding: 16, borderWidth: 2, borderColor: colors.primary },
  activeBadge: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  activeOrderNo: { fontFamily: 'monospace', fontWeight: '700', fontSize: fontSize.lg, marginTop: 8 },
  activeCustomer: { color: colors.textMuted, marginTop: 2 },
  activeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  activeMetaText: { fontSize: fontSize.sm, color: colors.text },
  viewBtn: { color: colors.primary, fontWeight: '800', marginTop: 10, fontSize: fontSize.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 12 },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    alignItems: 'flex-start',
    padding: 14,
    margin: '1.5%',
  },
  statValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: 8 },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  menuCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, padding: 16,
    borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center',
  },
  menuIcon: { fontSize: 24, marginRight: 14 },
  menuLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  menuSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textLight },
});

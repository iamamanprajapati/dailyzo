import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <LinearGradient colors={[colors.bg, '#1e293b']} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greet}>Hey, {user?.name?.split(' ')[0]}</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.textMutedDark} />
                <Text style={styles.heroSub}>{dateShort(new Date())} · Ready to ride?</Text>
              </View>
            </View>
            <Pressable style={styles.profileBtn} onPress={() => nav.navigate('Profile')}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                {user?.name?.[0]?.toUpperCase()}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.dutyCard, shadow.big, isOnDuty && shadow.glow]}>
            <View style={[styles.dutyIcon, { backgroundColor: isOnDuty ? colors.primarySoft : '#f1f5f9' }]}>
              <MaterialCommunityIcons
                name={isOnDuty ? 'motorbike' : 'sleep'}
                size={26}
                color={isOnDuty ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
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
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#fff"
              ios_backgroundColor="#475569"
              style={{ transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] }}
            />
          </View>
        </LinearGradient>

        {activeOrder && (
          <Pressable
            style={({ pressed }) => [styles.activeCard, shadow.card, pressed && { opacity: 0.95 }]}
            onPress={() => nav.navigate('ActiveOrder', { orderId: activeOrder._id })}
          >
            <View style={styles.activeBadge}>
              <Ionicons name="flash" size={11} color="#fff" />
              <Text style={styles.activeBadgeText}>ACTIVE ORDER</Text>
            </View>
            <Text style={styles.activeOrderNo}>{activeOrder.orderNumber}</Text>
            <View style={styles.activeCustomerRow}>
              <Ionicons name="person-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.activeCustomer}>For {activeOrder.user?.name}</Text>
            </View>
            <View style={styles.activeMeta}>
              <View style={styles.metaPill}>
                <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{activeOrder.items.length} items</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="cash-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{inr(activeOrder.total)}</Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: colors.primarySoft }]}>
                <View style={styles.dotPulse} />
                <Text style={[styles.metaText, { color: colors.primary, fontWeight: '800' }]}>
                  {activeOrder.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.openBtn}>
              <Text style={styles.openBtnText}>Open delivery</Text>
              <Ionicons name="arrow-forward-circle" size={18} color={colors.primary} />
            </View>
          </Pressable>
        )}

        <View style={styles.statsGrid}>
          <Stat icon="cube" label="Total Deliveries" value={profile?.completedOrders || 0} color="#3b82f6" />
          <Stat icon="cash-outline" label="Total Earnings" value={inr(profile?.earnings || 0)} color="#10b981" />
          <Stat icon="star" label="Rating" value={profile?.rating?.toFixed(1) || '—'} color="#f59e0b" />
          <Stat icon="motorbike" iconLib="mci" label="Vehicle" value={profile?.vehicleNumber || '—'} small color="#8b5cf6" />
        </View>

        <Pressable style={[styles.menuCard, shadow.card]} onPress={() => nav.navigate('History')}>
          <View style={[styles.menuIconBox, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="bar-chart" size={20} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Order history & earnings</Text>
            <Text style={styles.menuSub}>Track your past deliveries</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </Pressable>

        <Pressable style={[styles.menuCard, shadow.card]} onPress={() => nav.navigate('Profile')}>
          <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="motorbike" size={20} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Profile & vehicle</Text>
            <Text style={styles.menuSub}>{profile?.vehicleType?.toUpperCase() || 'Bike'} · {profile?.vehicleNumber}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const Stat = ({ icon, iconLib = 'ion', label, value, small, color = colors.primary }) => (
  <View style={[styles.statCard, shadow.card]}>
    <View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
      {iconLib === 'mci'
        ? <MaterialCommunityIcons name={icon} size={20} color={color} />
        : <Ionicons name={icon} size={20} color={color} />}
    </View>
    <Text style={[styles.statValue, small && { fontSize: fontSize.md }]} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  hero: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 80 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greet: { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroSub: { fontSize: fontSize.sm, color: colors.textMutedDark },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  dutyCard: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 24,
  },
  dutyIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  dutyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  dutySub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  activeCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: -60,
    borderRadius: radius.xl, padding: 16, borderWidth: 2, borderColor: colors.primary,
  },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  activeBadgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  activeOrderNo: { fontWeight: '800', fontSize: fontSize.lg, marginTop: 10, color: colors.text },
  activeCustomerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  activeCustomer: { color: colors.textMuted, fontWeight: '600' },
  activeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  dotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
  },
  openBtnText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 8 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    gap: 6,
  },
  statIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  menuCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 14,
    borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  menuSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});

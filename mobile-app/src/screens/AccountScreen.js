import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';

const ITEMS = [
  { icon: 'receipt-outline', label: 'My Orders', screen: 'Orders' },
  { icon: 'location-outline', label: 'Saved Addresses', screen: 'AddAddress' },
  { icon: 'pricetag-outline', label: 'Coupons & Offers', screen: 'CouponsOffers' },
  { icon: 'wallet-outline', label: 'Dailyzo Wallet', screen: 'Wallet' },
  { icon: 'star-outline', label: 'Ratings & Reviews', screen: 'RatingsReviews' },
  { icon: 'gift-outline', label: 'Refer & Earn', screen: 'ReferEarn' },
  { icon: 'chatbubble-ellipses-outline', label: 'Help & Support', screen: 'HelpSupport' },
  { icon: 'information-circle-outline', label: 'About Dailyzo', screen: 'About' },
];

export default function AccountScreen() {
  const nav = useNavigation();
  const { user, logout, setUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      /* ignore */
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  if (!user) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="person-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>Sign in to access your account</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <LinearGradient colors={['#dcfce7', '#fff']} style={styles.header}>
        <View style={[styles.avatar]}>
          <Text style={{ fontSize: 30, color: colors.primaryDark, fontWeight: '800' }}>{user.name?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={12} color={colors.textMuted} />
          <Text style={styles.contact}>{user.phone || user.email}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.statsRow]}>
        <Stat icon="cube-outline" label="Orders" value="View" onPress={() => nav.navigate('Tabs', { screen: 'Orders' })} />
        <View style={styles.statDivider} />
        <Stat icon="wallet-outline" label="Wallet" value={`₹${user.walletBalance ?? 0}`} onPress={() => nav.navigate('Wallet')} />
        <View style={styles.statDivider} />
        <Stat icon="location-outline" label="Addresses" value={user.addresses?.length || 0} onPress={() => nav.navigate('AddAddress')} />
      </View>

      <View style={styles.menuCard}>
        {ITEMS.map((item, idx) => {
          const isLast = idx === ITEMS.length - 1;
          return (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuRow,
                !isLast && styles.menuRowBorder,
                pressed && styles.menuRowPressed,
              ]}
              onPress={() => {
                if (!item.screen) return;
                if (item.screen === 'Orders') nav.navigate('Tabs', { screen: 'Orders' });
                else nav.navigate(item.screen);
              }}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon} size={20} color={colors.primaryDark} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>
          );
        })}
      </View>

      <Button title="Logout" variant="outline" onPress={logout} style={{ margin: 16 }} />
      <View style={styles.versionRow}>
        <MaterialCommunityIcons name="leaf" size={14} color={colors.primary} />
        <Text style={styles.version}>Dailyzo v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const Stat = ({ icon, label, value, onPress }) => (
  <Pressable onPress={onPress} style={styles.statCard}>
    <View style={styles.statIconBox}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.surface },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: fontSize.lg, fontWeight: '700', marginTop: 8, color: colors.text },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 30, alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.primary,
  },
  name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  contact: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 12, marginTop: -16,
    borderRadius: radius.lg, padding: 12,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: fontSize.md, fontWeight: '800', marginTop: 6, color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  menuCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: .5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuRowPressed: { backgroundColor: colors.surfaceAlt },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  version: { textAlign: 'center', color: colors.textLight, fontSize: fontSize.xs },
});

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';

const ITEMS = [
  { icon: '📦', label: 'My Orders', screen: 'Orders' },
  { icon: '📍', label: 'Saved Addresses', screen: 'AddAddress' },
  { icon: '🎫', label: 'Coupons & Offers' },
  { icon: '👛', label: 'BB Wallet' },
  { icon: '⭐', label: 'Ratings & Reviews' },
  { icon: '🎁', label: 'Refer & Earn' },
  { icon: '💬', label: 'Help & Support' },
  { icon: 'ℹ️', label: 'About Dailyzo' },
];

export default function AccountScreen() {
  const nav = useNavigation();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 60 }}>👤</Text>
        <Text style={styles.emptyText}>Sign in to access your account</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={{ fontSize: 28, color: colors.primary, fontWeight: '800' }}>{user.name?.[0]}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.contact}>{user.phone || user.email}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat icon="📦" label="Orders" value={'View'} onPress={() => nav.navigate('Orders')} />
        <Stat icon="👛" label="BBWallet" value={`₹${user.walletBalance || 0}`} />
        <Stat icon="📍" label="Addresses" value={user.addresses?.length || 0} onPress={() => nav.navigate('AddAddress')} />
      </View>

      <View style={styles.menu}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={styles.menuRow}
            onPress={() => item.screen && nav.navigate(item.screen)}
          >
            <Text style={{ fontSize: 22, marginRight: 14 }}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <Button title="Logout" variant="outline" onPress={logout} style={{ margin: 16 }} />
      <Text style={styles.version}>Dailyzo v1.0.0</Text>
    </ScrollView>
  );
}

const Stat = ({ icon, label, value, onPress }) => (
  <Pressable onPress={onPress} style={styles.statCard}>
    <Text style={{ fontSize: 24 }}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: fontSize.lg, fontWeight: '700', marginTop: 16 },
  header: {
    paddingTop: 56, padding: 16, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  contact: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 8, borderBottomWidth: 1, borderColor: colors.border },
  statCard: { flex: 1, alignItems: 'center', padding: 10 },
  statValue: { fontSize: fontSize.md, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  menu: { backgroundColor: '#fff', marginTop: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: colors.border },
  menuLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
  chevron: { fontSize: 24, color: colors.textLight },
  version: { textAlign: 'center', color: colors.textLight, fontSize: fontSize.xs, marginTop: 8 },
});

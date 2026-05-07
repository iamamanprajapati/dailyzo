import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';
import { inr } from '../utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    api.get('/delivery/me').then(({ data }) => setPartner(data.partner)).catch(() => {});
  }, []);

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 30, color: '#fff', fontWeight: '800' }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.contact}>{user?.phone}</Text>
        {user?.email && <Text style={styles.contactSmall}>{user.email}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <Row label="Type" value={partner?.vehicleType?.toUpperCase() || '—'} />
        <Row label="Number" value={partner?.vehicleNumber || '—'} />
        <Row label="License" value={partner?.licenseNumber || 'Not set'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <Row label="Total deliveries" value={partner?.completedOrders || 0} />
        <Row label="Total earnings" value={inr(partner?.earnings || 0)} />
        <Row label="Rating" value={`${partner?.rating?.toFixed(1) || '—'} ⭐`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Row label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
        <Row label="Status" value={user?.isActive ? '✓ Active' : 'Disabled'} />
      </View>

      <Pressable style={styles.menuRow}>
        <Text style={styles.menuIcon}>💬</Text>
        <Text style={styles.menuLabel}>Support & help</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable style={styles.menuRow}>
        <Text style={styles.menuIcon}>📋</Text>
        <Text style={styles.menuLabel}>Terms & policies</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Button title="Logout" variant="danger" onPress={confirmLogout} style={{ margin: 16 }} />
      <Text style={styles.version}>Dailyzo Rider v1.0.0</Text>
    </ScrollView>
  );
}

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { paddingTop: 60, padding: 24, alignItems: 'center', backgroundColor: colors.bg },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', marginTop: 12 },
  contact: { color: colors.textMutedDark, marginTop: 4 },
  contactSmall: { color: colors.textMutedDark, fontSize: fontSize.sm },
  section: { backgroundColor: '#fff', marginTop: 12, padding: 16, marginHorizontal: 12, borderRadius: radius.lg },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: colors.textMuted, fontSize: fontSize.md },
  rowValue: { fontWeight: '700', color: colors.text, fontSize: fontSize.md },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 6,
    padding: 14, borderRadius: radius.lg,
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '600' },
  chevron: { fontSize: 22, color: colors.textLight },
  version: { textAlign: 'center', color: colors.textLight, fontSize: fontSize.xs, marginTop: 8 },
});

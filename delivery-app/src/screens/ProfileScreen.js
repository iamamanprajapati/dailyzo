import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';
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
    <ScrollView style={{ flex: 1, backgroundColor: '#f1f5f9' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={[colors.bg, '#1e293b']} style={styles.header}>
        <View style={[styles.avatar, shadow.glow]}>
          <Text style={{ fontSize: 30, color: '#fff', fontWeight: '800' }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={12} color={colors.textMutedDark} />
          <Text style={styles.contact}>{user?.phone}</Text>
        </View>
        {user?.email && (
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={12} color={colors.textMutedDark} />
            <Text style={styles.contactSmall}>{user.email}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={[styles.section, shadow.card]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="motorbike" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Vehicle</Text>
        </View>
        <Row icon="car-outline" label="Type" value={partner?.vehicleType?.toUpperCase() || '—'} />
        <Row icon="card-outline" label="Number" value={partner?.vehicleNumber || '—'} />
        <Row icon="document-text-outline" label="License" value={partner?.licenseNumber || 'Not set'} />
      </View>

      <View style={[styles.section, shadow.card]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={18} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Performance</Text>
        </View>
        <Row icon="cube-outline" label="Total deliveries" value={partner?.completedOrders || 0} />
        <Row icon="cash-outline" label="Total earnings" value={inr(partner?.earnings || 0)} />
        <Row icon="star" label="Rating" value={`${partner?.rating?.toFixed(1) || '—'} ⭐`} />
      </View>

      <View style={[styles.section, shadow.card]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Account</Text>
        </View>
        <Row icon="calendar-outline" label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
        <Row icon="shield-checkmark-outline" label="Status" value={user?.isActive ? 'Active' : 'Disabled'} />
      </View>

      <View style={[styles.menuSection, shadow.card]}>
        <Pressable style={styles.menuRow}>
          <View style={[styles.menuIconBox, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
          </View>
          <Text style={styles.menuLabel}>Support & help</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
        <Pressable style={[styles.menuRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="document-text-outline" size={18} color="#f59e0b" />
          </View>
          <Text style={styles.menuLabel}>Terms & policies</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
      </View>

      <Button title="Logout" variant="danger" onPress={confirmLogout} style={{ margin: 16 }} />
      <View style={styles.versionRow}>
        <MaterialCommunityIcons name="motorbike" size={14} color={colors.primary} />
        <Text style={styles.version}>Dailyzo Rider v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { paddingTop: 60, padding: 24, alignItems: 'center', paddingBottom: 30 },
  avatar: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: '#fff', marginTop: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  contact: { color: colors.textMutedDark, fontSize: fontSize.sm, fontWeight: '600' },
  contactSmall: { color: colors.textMutedDark, fontSize: fontSize.xs },
  section: {
    backgroundColor: '#fff', marginTop: 12, padding: 16,
    marginHorizontal: 12, borderRadius: radius.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },
  rowValue: { fontWeight: '800', color: colors.text, fontSize: fontSize.md },
  menuSection: {
    backgroundColor: '#fff', marginTop: 12, marginHorizontal: 12, borderRadius: radius.lg, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderColor: colors.border,
  },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  version: { textAlign: 'center', color: colors.textLight, fontSize: fontSize.xs },
});

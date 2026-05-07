import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';

const LABELS = [
  { id: 'Home', icon: 'home' },
  { id: 'Work', icon: 'briefcase' },
  { id: 'Other', icon: 'location' },
];

export default function AddAddressScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);

  const [form, setForm] = useState({
    label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '',
    isDefault: true,
    location: { type: 'Point', coordinates: [0, 0] },
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const draft = route.params?.draft;
    if (draft) {
      setForm((f) => ({ ...f, ...draft }));
    }
  }, [route.params?.draft]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const detect = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location access from settings to auto-fill your address.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = places?.[0];
      if (!place) {
        Alert.alert('Could not detect', 'Try again or fill in manually.');
        return;
      }
      setForm((f) => ({
        ...f,
        line1: f.line1 || [place.name, place.street].filter(Boolean).join(', ') || 'Current location',
        line2: f.line2 || place.district || place.subregion || '',
        city: f.city || place.city || place.region || '',
        state: f.state || place.region || '',
        pincode: f.pincode || place.postalCode || '',
        location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] },
      }));
    } catch (err) {
      Alert.alert('Location error', err.message || 'Could not fetch location');
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    if (!form.line1 || !form.city || !form.pincode) {
      return Alert.alert('Missing fields', 'Please fill address line, city and pincode.');
    }
    setSaving(true);
    try {
      const { data } = await api.post('/addresses', form);
      setUser({ ...user, addresses: data.addresses });
      nav.goBack();
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Pressable style={[styles.detectCard, shadow.card]} onPress={detect} disabled={locating}>
        <View style={styles.detectIcon}>
          {locating
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primary} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detectTitle}>{locating ? 'Locating you…' : 'Use my current location'}</Text>
          <Text style={styles.detectSub}>Auto-fills address using your phone's GPS</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </Pressable>

      <Text style={styles.sectionLabel}>Save address as</Text>
      <View style={styles.chipRow}>
        {LABELS.map((l) => {
          const active = form.label === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => set('label', l.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Ionicons
                name={l.icon}
                size={14}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{l.id}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.formCard, shadow.card]}>
        <Field label="House / Flat / Building *" value={form.line1} onChange={(v) => set('line1', v)} icon="home-outline" />
        <Field label="Apartment / Tower" value={form.line2} onChange={(v) => set('line2', v)} icon="business-outline" />
        <Field label="Landmark" value={form.landmark} onChange={(v) => set('landmark', v)} icon="location-outline" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="City *" value={form.city} onChange={(v) => set('city', v)} icon="map-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="State" value={form.state} onChange={(v) => set('state', v)} icon="flag-outline" />
          </View>
        </View>
        <Field
          label="Pincode *"
          value={form.pincode}
          onChange={(v) => set('pincode', v)}
          keyboardType="number-pad"
          icon="pin-outline"
        />
      </View>

      {form.location?.coordinates?.[0] !== 0 && (
        <View style={styles.gpsBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.gpsText}>GPS coordinates captured</Text>
        </View>
      )}

      <Button title={saving ? 'Saving…' : 'Save Address'} loading={saving} onPress={submit} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const Field = ({ label, value, onChange, keyboardType, icon }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      {icon && <Ionicons name={icon} size={18} color={colors.textLight} style={{ marginRight: 8 }} />}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textLight}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  detectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  detectIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  detectTitle: { fontWeight: '800', color: colors.text, fontSize: fontSize.md },
  detectSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  sectionLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 8, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: '700', fontSize: fontSize.sm },
  chipTextActive: { color: colors.primary },
  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: radius.lg },
  label: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: fontSize.md, color: colors.text },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.md, backgroundColor: colors.primarySoft, alignSelf: 'flex-start',
  },
  gpsText: { color: colors.primaryDark, fontWeight: '700', fontSize: fontSize.sm },
});

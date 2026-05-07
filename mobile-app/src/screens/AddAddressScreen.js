import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';

export default function AddAddressScreen() {
  const nav = useNavigation();
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);

  const [form, setForm] = useState({
    label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '', isDefault: true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
      <Text style={styles.title}>Add new address</Text>

      <Text style={styles.label}>Save as</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {['Home', 'Work', 'Other'].map((l) => (
          <Text
            key={l}
            onPress={() => set('label', l)}
            style={[styles.chip, form.label === l && styles.chipActive]}
          >
            {l}
          </Text>
        ))}
      </View>

      <Field label="Address (House, Flat, Street) *" value={form.line1} onChange={(v) => set('line1', v)} />
      <Field label="Apartment / Tower (optional)" value={form.line2} onChange={(v) => set('line2', v)} />
      <Field label="Landmark (optional)" value={form.landmark} onChange={(v) => set('landmark', v)} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="City *" value={form.city} onChange={(v) => set('city', v)} /></View>
        <View style={{ flex: 1 }}><Field label="State" value={form.state} onChange={(v) => set('state', v)} /></View>
      </View>
      <Field label="Pincode *" value={form.pincode} onChange={(v) => set('pincode', v)} keyboardType="number-pad" />

      <Button title={saving ? 'Saving…' : 'Save Address'} loading={saving} onPress={submit} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const Field = ({ label, value, onChange, keyboardType }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboardType} />
  </View>
);

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: 20 },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12, fontSize: fontSize.md },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.border, color: colors.textMuted, fontWeight: '600' },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary, color: colors.primary },
});

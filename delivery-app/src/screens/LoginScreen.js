import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';

export default function LoginScreen() {
  const setAuth = useAuth((s) => s.setAuth);
  const [phone, setPhone] = useState('9111100001');
  const [password, setPassword] = useState('pass1234');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      if (data.user.role !== 'delivery') {
        Alert.alert('Access denied', 'This app is only for delivery partners.');
        return;
      }
      setAuth(data);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛵</Text>
        </View>
        <Text style={styles.title}>Dailyzo Rider</Text>
        <Text style={styles.tagline}>Earn while you ride · Real-time deliveries</Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.heading}>Sign in to your rider account</Text>

        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.code}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, { width: '100%' }]}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Sign in" loading={loading} onPress={submit} style={{ marginTop: 16 }} />

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo riders (from seed data)</Text>
          <Text style={styles.demoText}>Phone: 9111100001  ·  Password: pass1234</Text>
          <Text style={styles.demoText}>Phone: 9111100002  ·  Password: pass1234</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  logoBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: fontSize.md, color: colors.textMutedDark, marginTop: 4 },
  form: { padding: 20, flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: {
    fontSize: fontSize.lg, fontWeight: '600', color: colors.text,
    paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: radius.md,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: radius.md, fontSize: fontSize.lg,
    backgroundColor: '#fff',
  },
  demoBox: {
    marginTop: 32, padding: 14, backgroundColor: '#f1f5f9', borderRadius: radius.md,
  },
  demoTitle: { fontWeight: '700', marginBottom: 6, color: colors.text },
  demoText: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: 'monospace' },
});

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';

export default function LoginScreen() {
  const setAuth = useAuth((s) => s.setAuth);
  const [phone, setPhone] = useState('9111100001');
  const [password, setPassword] = useState('pass1234');
  const [show, setShow] = useState(false);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.hero}>
          <View style={[styles.logoBox, shadow.glow]}>
            <MaterialCommunityIcons name="motorbike" size={42} color="#fff" />
          </View>
          <Text style={styles.title}>Dailyzo Rider</Text>
          <Text style={styles.tagline}>Earn while you ride · Real-time deliveries</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.subheading}>Use your rider credentials to continue</Text>

          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.code}>
              <Text style={styles.codeText}>+91</Text>
            </View>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons name="call-outline" size={18} color={colors.textLight} />
              <TextInput
                style={styles.input}
                placeholder="98XXXXXXXX"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
            />
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
              onPress={() => setShow((s) => !s)}
            />
          </View>

          <Button title="Sign in" loading={loading} onPress={submit} style={{ marginTop: 20 }} />

          <View style={styles.demoBox}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle" size={14} color={colors.primary} />
              <Text style={styles.demoTitle}>Demo riders (from seed)</Text>
            </View>
            <Text style={styles.demoText}>9111100001  ·  pass1234</Text>
            <Text style={styles.demoText}>9111100002  ·  pass1234</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  logoBox: {
    width: 88, height: 88, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: fontSize.md, color: colors.textMutedDark, marginTop: 4, textAlign: 'center' },
  form: { padding: 20, flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subheading: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4 },
  label: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 6, marginTop: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: radius.md },
  codeText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: '#fff',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: fontSize.lg, color: colors.text },
  demoBox: {
    marginTop: 28, padding: 14, backgroundColor: '#f1f5f9', borderRadius: radius.md,
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  demoTitle: { fontWeight: '800', color: colors.text, fontSize: fontSize.sm },
  demoText: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
});

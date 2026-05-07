import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, spacing } from '../theme';

export default function LoginScreen() {
  const setAuth = useAuth((s) => s.setAuth);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length < 10) return Alert.alert('Invalid number', 'Please enter a valid 10-digit phone number.');
    setLoading(true);
    try {
      await api.post('/auth/otp/send', { phone });
      setStep('otp');
      Alert.alert('OTP sent (mock)', 'Use 123456 to log in.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp, name: name || undefined });
      setAuth(data);
    } catch (err) {
      Alert.alert('Invalid OTP', err.response?.data?.message || 'Try 123456');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.primarySoft, '#fff']} style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛒</Text>
        </View>
        <Text style={styles.title}>Dailyzo</Text>
        <Text style={styles.tagline}>Groceries delivered in 10 minutes</Text>
      </LinearGradient>

      <View style={styles.form}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Enter your mobile number</Text>
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
            <Text style={styles.label}>Your name (optional)</Text>
            <TextInput style={styles.input} placeholder="Aman Kumar" value={name} onChangeText={setName} />
            <Button title="Send OTP" onPress={sendOtp} loading={loading} style={{ marginTop: 16 }} />
            <Text style={styles.hint}>By continuing, you agree to our terms</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter the 6-digit OTP sent to</Text>
            <Text style={styles.phoneLine}>+91 {phone}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <Button title="Verify & Continue" onPress={verify} loading={loading} style={{ marginTop: 16 }} />
            <Button title="← Change number" variant="ghost" onPress={() => setStep('phone')} style={{ marginTop: 8 }} />
          </>
        )}
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
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  tagline: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4 },
  form: { padding: spacing(6) },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: {
    fontSize: fontSize.lg, fontWeight: '600', color: colors.text,
    paddingHorizontal: 12, paddingVertical: 14, backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
  },
  input: {
    flex: 1,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: radius.md, fontSize: fontSize.lg,
    backgroundColor: '#fff',
  },
  otpInput: { letterSpacing: 8, textAlign: 'center', fontWeight: '700', fontSize: 24 },
  phoneLine: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: 12 },
  hint: { fontSize: fontSize.xs, color: colors.textLight, textAlign: 'center', marginTop: 16 },
});

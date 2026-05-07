import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, spacing, shadow } from '../theme';

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
      <LinearGradient colors={['#bbf7d0', '#fff']} style={styles.hero}>
        <View style={[styles.logoBox, shadow.glow]}>
          <MaterialCommunityIcons name="basket" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>Dailyzo</Text>
        <Text style={styles.tagline}>Groceries delivered in 10 minutes</Text>
      </LinearGradient>

      <View style={styles.form}>
        {step === 'phone' ? (
          <>
            <Text style={styles.heading}>Welcome 👋</Text>
            <Text style={styles.subheading}>Enter your phone to continue</Text>

            <Text style={styles.label}>Mobile number</Text>
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

            <Text style={styles.label}>Your name (optional)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={colors.textLight} />
              <TextInput
                style={styles.input}
                placeholder="Aman Kumar"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Button title="Send OTP" onPress={sendOtp} loading={loading} style={{ marginTop: 20 }} />
            <View style={styles.hintRow}>
              <Ionicons name="shield-checkmark" size={14} color={colors.textMuted} />
              <Text style={styles.hint}>By continuing, you agree to our terms</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Verify OTP</Text>
            <Text style={styles.subheading}>
              Enter the 6-digit code sent to <Text style={{ fontWeight: '800', color: colors.text }}>+91 {phone}</Text>
            </Text>

            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={colors.textLight} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

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
    width: 88, height: 88, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4 },
  form: { padding: spacing(6), flex: 1, backgroundColor: '#fff' },
  heading: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subheading: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 4, marginBottom: 8 },
  label: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 6, marginTop: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: {
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
  },
  codeText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: '#fff',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: fontSize.lg, color: colors.text },
  otpInput: { letterSpacing: 8, textAlign: 'center', fontWeight: '800', fontSize: 22 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
});

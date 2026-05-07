import { View, Text, StyleSheet, ScrollView, Pressable, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../store/auth';
import { colors, fontSize, radius, shadow } from '../theme';

export default function ReferEarnScreen() {
  const user = useAuth((s) => s.user);
  const raw = (user?.phone || user?.email || 'FRIEND').toString().replace(/\D/g, '').slice(-6) || '123456';
  const referralCode = `DZ${raw}`;

  const share = async () => {
    const msg = `Join me on Dailyzo — groceries in 10 minutes. Use my code ${referralCode} when you sign up!\n\nhttps://dailyzo.app`;
    try {
      await Share.share({ message: msg });
    } catch {
      Alert.alert('Could not share');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>Invite friends and earn rewards when they place their first order (promo rules apply).</Text>

        <View style={[styles.codeCard, shadow.card]}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.codeValue}>{referralCode}</Text>
          <Pressable onPress={share} style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.9 }]}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <Text style={styles.shareText}>Share invite</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>How it works</Text>
        <Step n={1} title="Share your code" text="Send your unique code to friends and family." color="#dbeafe" iconColor="#3b82f6" />
        <Step n={2} title="They sign up" text="Your friend creates an account on Dailyzo." color="#fce7f3" iconColor="#ec4899" />
        <Step n={3} title="You earn" text="Rewards are credited when eligibility criteria are met." color="#d1fae5" iconColor="#059669" />
      </ScrollView>
    </View>
  );
}

function Step({ n, title, text, color, iconColor }) {
  return (
    <View style={[styles.step, shadow.card]}>
      <View style={[styles.stepBadge, { backgroundColor: color }]}>
        <Text style={[styles.stepNum, { color: iconColor }]}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 12, paddingBottom: 32 },
  intro: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 18,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  shareText: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: fontSize.lg, fontWeight: '800' },
  stepTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  stepText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
});

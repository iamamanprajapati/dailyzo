import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, shadow } from '../theme';

export default function RatingsReviewsScreen() {
  const nav = useNavigation();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, shadow.card]}>
          <View style={[styles.heroIcon, { backgroundColor: '#ffedd5' }]}>
            <Ionicons name="star" size={32} color="#f97316" />
          </View>
          <Text style={styles.heroTitle}>Your feedback matters</Text>
          <Text style={styles.heroSub}>
            Rate products and delivery from your completed orders. Reviews help neighbours shop smarter.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, shadow.card, pressed && { opacity: 0.92 }]}
          onPress={() => nav.navigate('Tabs', { screen: 'Orders' })}
        >
          <View style={[styles.ctaIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="receipt-outline" size={22} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>View past orders</Text>
            <Text style={styles.ctaSub}>Tap an order to track or revisit details</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </Pressable>

        <Text style={styles.sectionTitle}>Tips</Text>
        <Tip icon="checkmark-circle" color="#10b981" text="You can rate items after delivery is completed." />
        <Tip icon="time-outline" color="#64748b" text="Detailed product reviews will roll out in a future update." />
      </ScrollView>
    </View>
  );
}

function Tip({ icon, color, text }) {
  return (
    <View style={[styles.tip, shadow.card]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 12, paddingBottom: 32 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  ctaSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  tipText: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20, fontWeight: '600' },
});

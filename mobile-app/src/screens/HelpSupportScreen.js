import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, shadow } from '../theme';

const FAQ = [
  {
    q: 'How fast is delivery?',
    a: 'We target delivery in about 10 minutes after your order is confirmed, depending on location and demand.',
  },
  {
    q: 'How do I apply a coupon?',
    a: 'Open your cart, go to checkout, and enter your coupon code in the coupon field before placing the order.',
  },
  {
    q: 'Can I modify my order after placing it?',
    a: 'Contact support immediately — changes may be possible only before packing starts.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Cash on delivery, UPI, cards via Razorpay, and wallet (where enabled).',
  },
];

export default function HelpSupportScreen() {
  const [open, setOpen] = useState(0);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.contactCard, shadow.card]}>
          <Text style={styles.contactTitle}>Contact us</Text>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@dailyzo.app')}>
            <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="mail-outline" size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@dailyzo.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </Pressable>
          <Pressable style={styles.contactRow} onPress={() => Linking.openURL('tel:+911800123456')}>
            <View style={[styles.contactIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>1800-123-456 (10 AM – 10 PM)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Frequently asked</Text>
        {FAQ.map((item, idx) => {
          const expanded = open === idx;
          return (
            <Pressable
              key={item.q}
              style={[styles.faqItem, shadow.card, expanded && styles.faqOpen]}
              onPress={() => setOpen(expanded ? -1 : idx)}
            >
              <View style={styles.faqHead}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              </View>
              {expanded ? <Text style={styles.faqA}>{item.a}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 12, paddingBottom: 32 },
  contactCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 8, marginBottom: 20 },
  contactTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  contactValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  faqOpen: { paddingBottom: 16 },
  faqHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  faqQ: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text, lineHeight: 22 },
  faqA: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 10, lineHeight: 22, fontWeight: '600' },
});

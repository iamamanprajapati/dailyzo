import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import api from '../api/client';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr } from '../utils/format';

function formatBenefit(c) {
  if (c.type === 'flat') return `${inr(c.value)} off`;
  const cap = c.maxDiscount > 0 ? ` · max ${inr(c.maxDiscount)}` : '';
  return `${c.value}% off${cap}`;
}

export default function CouponsOffersScreen() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/coupons/available');
      setCoupons(data.coupons || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const copyCode = async (code) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', `${code} copied. Apply at checkout.`);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        <Text style={styles.intro}>Apply these codes at checkout to save on your order.</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : coupons.length === 0 ? (
          <View style={[styles.emptyCard, shadow.card]}>
            <Ionicons name="ticket-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No coupons right now</Text>
            <Text style={styles.emptySub}>Check back soon for new offers.</Text>
          </View>
        ) : (
          coupons.map((c) => (
            <View key={c.code} style={[styles.card, shadow.card]}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="pricetag" size={22} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>{c.code}</Text>
                <Text style={styles.desc}>{c.description || `Save ${formatBenefit(c)}`}</Text>
                {c.minOrderValue > 0 ? (
                  <Text style={styles.meta}>Min. order {inr(c.minOrderValue)}</Text>
                ) : (
                  <Text style={styles.meta}>No minimum order</Text>
                )}
              </View>
              <Pressable onPress={() => copyCode(c.code)} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={18} color={colors.primary} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 12, paddingBottom: 32 },
  intro: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 14, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  desc: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  meta: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: '600', marginTop: 4 },
  copyBtn: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignSelf: 'flex-start',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, fontSize, radius, shadow } from '../theme';

const version =
  Constants.expoConfig?.version ||
  Constants.manifest?.version ||
  '1.0.0';

export default function AboutScreen() {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <View style={[styles.logo, shadow.glow]}>
            <MaterialCommunityIcons name="basket" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Dailyzo</Text>
          <Text style={styles.tag}>Groceries in minutes</Text>
          <Text style={styles.ver}>Version {version}</Text>
        </View>

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.p}>
            Dailyzo connects you with local inventory for quick grocery delivery. This demo app showcases orders,
            checkout, live tracking, and partner delivery workflows.
          </Text>
        </View>

        <View style={[styles.card, shadow.card]}>
          <Row label="Build" value={Constants.expoConfig?.ios?.buildNumber || 'dev'} />
          <View style={styles.divider} />
          <Row label="Support" value="support@dailyzo.app" />
          <View style={styles.divider} />
          <Row label="©" value={`${new Date().getFullYear()} Dailyzo`} />
        </View>

        <Text style={styles.footer}>Made with care for fast commerce.</Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 12, paddingBottom: 40 },
  brand: { alignItems: 'center', paddingVertical: 24 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tag: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  ver: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 8, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  p: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 22, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '700' },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '700', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  footer: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textLight, marginTop: 16, fontWeight: '600' },
});

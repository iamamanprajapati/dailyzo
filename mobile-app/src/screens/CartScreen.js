import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr } from '../utils/format';

export default function CartScreen() {
  const nav = useNavigation();
  const { cart, load, loading, setQty } = useCart();
  const user = useAuth((s) => s.user);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>Please log in to view your cart</Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  if (cart.items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add fresh groceries from the home screen</Text>
        <Button title="Start Shopping" onPress={() => nav.navigate('Tabs', { screen: 'Home' })} style={{ marginTop: 20, paddingHorizontal: 30 }} />
      </View>
    );
  }

  const subtotal = cart.subtotal;
  const mrpTotal = cart.mrpTotal;
  const itemDiscount = mrpTotal - subtotal;
  const deliveryFee = subtotal >= 199 ? 0 : 25;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryIcon}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.etaTime}>Delivery in 10 mins</Text>
            <Text style={styles.itemCountText}>{cart.items.length} items in this order</Text>
          </View>
          {deliveryFee === 0 && (
            <View style={styles.freeBadge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          )}
        </View>

        <View style={[styles.itemsCard, shadow.card]}>
          {cart.items.map((item, idx) => {
            const p = item.product;
            const isLast = idx === cart.items.length - 1;
            return (
              <View key={item._id} style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
                {p.images?.[0] ? (
                  <Image source={{ uri: p.images[0] }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="image-outline" size={20} color={colors.textLight} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.unit}>{p.unit}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{inr(item.priceSnapshot)}</Text>
                    {item.mrpSnapshot > item.priceSnapshot && (
                      <Text style={styles.mrp}>{inr(item.mrpSnapshot)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.qtyBox}>
                  <Pressable onPress={() => setQty(p._id, item.quantity - 1)} style={styles.qBtn} hitSlop={6}>
                    <Ionicons name="remove" size={16} color="#fff" />
                  </Pressable>
                  <Text style={styles.qVal}>{item.quantity}</Text>
                  <Pressable onPress={() => setQty(p._id, item.quantity + 1)} style={styles.qBtn} hitSlop={6}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.billCard, shadow.card]}>
          <View style={styles.billHeaderRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.text} />
            <Text style={styles.billTitle}>Bill summary</Text>
          </View>
          <BillRow label="Item total" value={inr(mrpTotal)} />
          <BillRow label="Item discount" value={`− ${inr(itemDiscount)}`} positive />
          <BillRow label="Delivery fee" value={deliveryFee === 0 ? 'FREE' : inr(deliveryFee)} positive={deliveryFee === 0} />
          <BillRow label="Taxes & charges" value={inr(taxes)} />
          <View style={styles.divider} />
          <BillRow label="To Pay" value={inr(total)} bold />
          <View style={styles.savingsRow}>
            <Ionicons name="happy" size={14} color={colors.success} />
            <Text style={styles.savings}>
              You're saving {inr(itemDiscount + (deliveryFee === 0 ? 25 : 0))} on this order
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerSub}>TOTAL</Text>
          <Text style={styles.footerTotal}>{inr(total)}</Text>
        </View>
        <Button title="Proceed to Pay" onPress={() => nav.navigate('Checkout')} style={{ flex: 1, marginLeft: 16 }} />
      </View>
    </View>
  );
}

const BillRow = ({ label, value, positive, bold }) => (
  <View style={billStyles.row}>
    <Text style={[billStyles.label, bold && billStyles.bold]}>{label}</Text>
    <Text style={[billStyles.value, bold && billStyles.bold, positive && billStyles.positive]}>{value}</Text>
  </View>
);

const billStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  label: { fontSize: fontSize.md, color: colors.textMuted },
  value: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  bold: { fontWeight: '800', color: colors.text, fontSize: fontSize.lg },
  positive: { color: colors.success, fontWeight: '700' },
});

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.surface },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  deliveryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 14,marginTop:12
  },
  deliveryIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  etaTime: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  itemCountText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  freeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  freeBadgeText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '800' },
  itemsCard: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 14, paddingVertical: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border, gap: 12,
  },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.surface },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  unit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  price: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  mrp: { fontSize: fontSize.xs, color: colors.textLight, textDecorationLine: 'line-through' },
  qtyBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md,
  },
  qBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  qVal: { color: '#fff', fontWeight: '800', minWidth: 22, textAlign: 'center' },
  billCard: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  billHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  billTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  savingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  savings: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: '800' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  footerTotal: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  footerSub: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
});

import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';
import { inr } from '../utils/format';

export default function CartScreen() {
  const nav = useNavigation();
  const { cart, load, loading, setQty } = useCart();
  const user = useAuth((s) => s.user);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🛒</Text>
        <Text style={styles.emptyText}>Please log in to view your cart</Text>
      </View>
    );
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  if (cart.items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>🛒</Text>
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
          <View>
            <Text style={styles.etaTime}>⚡ Delivery in 10 mins</Text>
            <Text style={styles.itemCountText}>{cart.items.length} items in this order</Text>
          </View>
          {deliveryFee === 0 && <Text style={styles.freeBadge}>FREE DELIVERY 🎉</Text>}
        </View>

        <View style={styles.itemsCard}>
          {cart.items.map((item) => {
            const p = item.product;
            return (
              <View key={item._id} style={styles.row}>
                {p.images?.[0] && <Image source={{ uri: p.images[0] }} style={styles.thumb} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.unit}>{p.unit}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{inr(item.priceSnapshot)}</Text>
                    <Text style={styles.mrp}>{inr(item.mrpSnapshot)}</Text>
                  </View>
                </View>
                <View style={styles.qtyBox}>
                  <Pressable onPress={() => setQty(p._id, item.quantity - 1)}><Text style={styles.qBtn}>−</Text></Pressable>
                  <Text style={styles.qVal}>{item.quantity}</Text>
                  <Pressable onPress={() => setQty(p._id, item.quantity + 1)}><Text style={styles.qBtn}>+</Text></Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill summary</Text>
          <BillRow label="Item total" value={inr(mrpTotal)} />
          <BillRow label="Item discount" value={`− ${inr(itemDiscount)}`} positive />
          <BillRow label="Delivery fee" value={deliveryFee === 0 ? 'FREE' : inr(deliveryFee)} positive={deliveryFee === 0} />
          <BillRow label="Taxes & charges" value={inr(taxes)} />
          <View style={styles.divider} />
          <BillRow label="To Pay" value={inr(total)} bold />
          <Text style={styles.savings}>You're saving {inr(itemDiscount + (deliveryFee === 0 ? 25 : 0))} on this order ✨</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotal}>{inr(total)}</Text>
          <Text style={styles.footerSub}>TOTAL</Text>
        </View>
        <Button title="Proceed to Pay  →" onPress={() => nav.navigate('Checkout')} style={{ flex: 1, marginLeft: 16 }} />
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: fontSize.md, color: colors.textMuted },
  value: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  bold: { fontWeight: '800', color: colors.text, fontSize: fontSize.lg },
  positive: { color: colors.success, fontWeight: '700' },
});

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  deliveryCard: { backgroundColor: '#fff', padding: 16, marginTop: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etaTime: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  itemCountText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  freeBadge: { color: colors.success, fontSize: fontSize.xs, fontWeight: '800' },
  itemsCard: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12, backgroundColor: colors.surface },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  unit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  price: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  mrp: { fontSize: fontSize.xs, color: colors.textLight, textDecorationLine: 'line-through' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, gap: 4 },
  qBtn: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 12, paddingVertical: 6 },
  qVal: { color: '#fff', fontWeight: '800', minWidth: 20, textAlign: 'center' },
  billCard: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  billTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  savings: { fontSize: fontSize.xs, color: colors.success, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  footerTotal: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  footerSub: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
});

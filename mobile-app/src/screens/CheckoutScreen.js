import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import Button from '../components/Button';
import { colors, fontSize, radius } from '../theme';
import { inr } from '../utils/format';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', emoji: '💵' },
  { id: 'upi', label: 'UPI / GPay / PhonePe', sub: 'Instant payment', emoji: '📱' },
  { id: 'razorpay', label: 'Razorpay (Card/Netbanking)', sub: 'All payment methods', emoji: '💳' },
  { id: 'wallet', label: 'BB Wallet', sub: 'Use wallet balance', emoji: '👛' },
];

export default function CheckoutScreen() {
  const nav = useNavigation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const { cart, load: loadCart } = useCart();

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [selectedAddrId, setSelectedAddrId] = useState(addresses.find((a) => a.isDefault)?._id || addresses[0]?._id);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.get('/addresses').then(({ data }) => {
      setAddresses(data.addresses);
      if (!selectedAddrId) setSelectedAddrId(data.addresses.find((a) => a.isDefault)?._id || data.addresses[0]?._id);
      setUser({ ...user, addresses: data.addresses });
    });
  }, []);

  const subtotal = cart.subtotal;
  const mrpTotal = cart.mrpTotal;
  const itemDiscount = mrpTotal - subtotal;
  const deliveryFee = subtotal >= 199 ? 0 : 25;
  const taxes = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee + taxes);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, subtotal });
      setCouponDiscount(data.discount);
      setAppliedCoupon(data.coupon);
      Alert.alert('Coupon applied', `You saved ${inr(data.discount)}!`);
    } catch (err) {
      Alert.alert('Invalid coupon', err.response?.data?.message || 'Try a different code');
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddrId) return Alert.alert('Address required', 'Please select a delivery address.');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders/checkout', {
        addressId: selectedAddrId,
        paymentMethod,
        couponCode: appliedCoupon?.code,
      });

      if (paymentMethod !== 'cod') {
        await api.post('/payments/order', { orderId: data.order._id });
        await api.post('/payments/verify', {
          orderId: data.order._id,
          gatewayOrderId: `mock_${Date.now()}`,
          paymentId: `pay_mock_${Date.now()}`,
        });
      }

      await loadCart();
      nav.replace('OrderTracking', { orderId: data.order._id });
    } catch (err) {
      Alert.alert('Order failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Delivery address</Text>
            <Pressable onPress={() => nav.navigate('AddAddress')}>
              <Text style={styles.addBtn}>+ Add new</Text>
            </Pressable>
          </View>

          {addresses.length === 0 ? (
            <Pressable style={styles.addAddressBox} onPress={() => nav.navigate('AddAddress')}>
              <Text style={styles.addAddressText}>+ Add your first address</Text>
            </Pressable>
          ) : (
            addresses.map((a) => (
              <Pressable
                key={a._id}
                style={[styles.addrCard, selectedAddrId === a._id && styles.addrCardSelected]}
                onPress={() => setSelectedAddrId(a._id)}
              >
                <View style={styles.radio}>
                  {selectedAddrId === a._id && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrLabel}>{a.label}</Text>
                  <Text style={styles.addrText}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                  <Text style={styles.addrText}>{a.city}, {a.state} {a.pincode}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎟️ Apply coupon</Text>
          <View style={styles.couponRow}>
            <Text
              style={styles.couponInput}
              onPress={() => Alert.prompt?.('Coupon', 'Enter code', (t) => setCoupon((t || '').toUpperCase()))}
            >
              {coupon || 'Tap to enter (try WELCOME50)'}
            </Text>
            <Button title="Apply" variant="outline" onPress={applyCoupon} style={{ paddingVertical: 10 }} />
          </View>
          {appliedCoupon && (
            <Text style={styles.couponApplied}>✓ {appliedCoupon.code} — saved {inr(couponDiscount)}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment method</Text>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.payCard, paymentMethod === m.id && styles.payCardSelected]}
              onPress={() => setPaymentMethod(m.id)}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>{m.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.payLabel}>{m.label}</Text>
                <Text style={styles.paySub}>{m.sub}</Text>
              </View>
              <View style={styles.radio}>
                {paymentMethod === m.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 Bill</Text>
          <BillRow label="Item total" value={inr(mrpTotal)} />
          <BillRow label="Item discount" value={`− ${inr(itemDiscount)}`} positive />
          {couponDiscount > 0 && <BillRow label={`Coupon ${appliedCoupon?.code}`} value={`− ${inr(couponDiscount)}`} positive />}
          <BillRow label="Delivery" value={deliveryFee === 0 ? 'FREE' : inr(deliveryFee)} positive={deliveryFee === 0} />
          <BillRow label="Taxes & charges" value={inr(taxes)} />
          <View style={styles.divider} />
          <BillRow label="Grand total" value={inr(total)} bold />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerSub}>{paymentMethod === 'cod' ? 'PAY ON DELIVERY' : 'PAYING NOW'}</Text>
          <Text style={styles.footerTotal}>{inr(total)}</Text>
        </View>
        <Button
          title={placing ? 'Placing…' : 'Place Order  →'}
          loading={placing}
          onPress={placeOrder}
          style={{ flex: 1, marginLeft: 16 }}
        />
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
  section: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: 12 },
  addBtn: { color: colors.primary, fontWeight: '700' },
  addAddressBox: { borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: radius.md, padding: 20, alignItems: 'center' },
  addAddressText: { color: colors.primary, fontWeight: '700' },
  addrCard: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 8, alignItems: 'flex-start' },
  addrCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft + '40' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, marginRight: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  addrLabel: { fontWeight: '700', color: colors.text },
  addrText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.md, color: colors.text },
  couponApplied: { color: colors.success, fontWeight: '700', marginTop: 8 },
  payCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  payCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft + '40' },
  payLabel: { fontWeight: '600', color: colors.text },
  paySub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  footerTotal: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  footerSub: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
});

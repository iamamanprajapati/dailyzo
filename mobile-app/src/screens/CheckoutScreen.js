import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import api from '../api/client';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import Button from '../components/Button';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr } from '../utils/format';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', icon: 'cash-outline', iconLib: 'ion', color: '#10b981' },
  { id: 'upi', label: 'UPI / GPay / PhonePe', sub: 'Instant payment', icon: 'cellphone', iconLib: 'mci', color: '#3b82f6' },
  { id: 'razorpay', label: 'Card / Netbanking', sub: 'Razorpay secure checkout', icon: 'cc-visa', iconLib: 'fa', color: '#8b5cf6' },
  { id: 'wallet', label: 'Dailyzo Wallet', sub: 'Use wallet balance', icon: 'wallet-outline', iconLib: 'ion', color: '#f59e0b' },
];

function PaymentIcon({ method, color }) {
  const props = { size: 22, color };
  if (method.iconLib === 'mci') return <MaterialCommunityIcons name={method.icon} {...props} />;
  if (method.iconLib === 'fa') return <FontAwesome5 name={method.icon} {...props} />;
  return <Ionicons name={method.icon} {...props} />;
}

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
        <View style={[styles.section, shadow.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Delivery address</Text>
            </View>
            <Pressable onPress={() => nav.navigate('AddAddress')} style={styles.addBtnRow}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addBtn}>Add new</Text>
            </Pressable>
          </View>

          {addresses.length === 0 ? (
            <Pressable style={styles.addAddressBox} onPress={() => nav.navigate('AddAddress')}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.addAddressText}>Add your first address</Text>
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
                  <View style={styles.addrLabelRow}>
                    <Ionicons
                      name={a.label?.toLowerCase() === 'work' ? 'briefcase' : 'home'}
                      size={12} color={colors.primary}
                    />
                    <Text style={styles.addrLabel}>{a.label}</Text>
                    {a.isDefault && <Text style={styles.defaultPill}>DEFAULT</Text>}
                  </View>
                  <Text style={styles.addrText}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</Text>
                  <Text style={styles.addrText}>{a.city}, {a.state} {a.pincode}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={[styles.section, shadow.card]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="ticket" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Apply coupon</Text>
          </View>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Try WELCOME50 or SAVE10"
              placeholderTextColor={colors.textLight}
              value={coupon}
              onChangeText={(t) => setCoupon(t.toUpperCase())}
              autoCapitalize="characters"
            />
            <Button title="Apply" variant="outline" onPress={applyCoupon} style={{ paddingVertical: 11 }} />
          </View>
          {appliedCoupon && (
            <View style={styles.couponApplied}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.couponAppliedText}>
                {appliedCoupon.code} applied — saved {inr(couponDiscount)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, shadow.card]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment method</Text>
          </View>
          {PAYMENT_METHODS.map((m) => {
            const selected = paymentMethod === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.payCard, selected && styles.payCardSelected]}
                onPress={() => setPaymentMethod(m.id)}
              >
                <View style={[styles.payIconBox, { backgroundColor: m.color + '18' }]}>
                  <PaymentIcon method={m} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payLabel}>{m.label}</Text>
                  <Text style={styles.paySub}>{m.sub}</Text>
                </View>
                <View style={styles.radio}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.section, shadow.card]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Bill details</Text>
          </View>
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
          title={placing ? 'Placing…' : 'Place Order'}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  label: { fontSize: fontSize.md, color: colors.textMuted },
  value: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  bold: { fontWeight: '800', color: colors.text, fontSize: fontSize.lg },
  positive: { color: colors.success, fontWeight: '700' },
});

const styles = StyleSheet.create({
  section: { backgroundColor: '#fff', padding: 16, marginTop: 8, marginHorizontal: 12, borderRadius: radius.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  addBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  addBtn: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm },
  addAddressBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: radius.md, padding: 20,
  },
  addAddressText: { color: colors.primary, fontWeight: '700' },
  addrCard: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14, marginBottom: 8, alignItems: 'flex-start',
  },
  addrCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft + '30' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.primary, marginRight: 12, marginTop: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addrLabel: { fontWeight: '800', color: colors.text },
  defaultPill: {
    fontSize: 9, color: colors.primaryDark, fontWeight: '800',
    backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    letterSpacing: 0.5,
  },
  addrText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.md,
    color: colors.text, fontSize: fontSize.md, fontWeight: '700',
  },
  couponApplied: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.primarySoft, borderRadius: radius.sm, alignSelf: 'flex-start',
  },
  couponAppliedText: { color: colors.success, fontWeight: '700', fontSize: fontSize.sm },
  payCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 12, marginBottom: 8,
  },
  payCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft + '30' },
  payIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payLabel: { fontWeight: '700', color: colors.text },
  paySub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  footerTotal: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  footerSub: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
});

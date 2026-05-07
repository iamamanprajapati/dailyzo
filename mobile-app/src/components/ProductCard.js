import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { colors, radius, fontSize, shadow } from '../theme';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { inr } from '../utils/format';

export default function ProductCard({ product, onPress }) {
  const { add, setQty, qtyOf } = useCart();
  const user = useAuth((s) => s.user);
  const qty = qtyOf(product._id);

  const handleAdd = async (e) => {
    e?.stopPropagation?.();
    if (!user) return Alert.alert('Sign in needed', 'Please log in to add items to cart.');
    try {
      await add(product._id, 1);
    } catch (err) {
      Alert.alert('Oops', err.response?.data?.message || 'Failed to add');
    }
  };

  const handleInc = async (e) => {
    e?.stopPropagation?.();
    await setQty(product._id, qty + 1);
  };
  const handleDec = async (e) => {
    e?.stopPropagation?.();
    await setQty(product._id, qty - 1);
  };

  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <Pressable onPress={onPress} style={[styles.card, shadow.card]}>
      {discount > 0 && (
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      )}
      <View style={styles.imageWrap}>
        {product.images?.[0] && <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />}
      </View>

      <View style={styles.body}>
        <View style={styles.etaRow}>
          <View style={styles.etaDot} />
          <Text style={styles.etaText}>{product.deliveryEtaMins || 10} mins</Text>
        </View>

        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        <View style={styles.bottomRow}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{inr(product.price)}</Text>
              {discount > 0 && <Text style={styles.mrp}>{inr(product.mrp)}</Text>}
            </View>
          </View>

          {qty === 0 ? (
            <Pressable onPress={handleAdd} style={styles.addBtn}>
              <Text style={styles.addText}>ADD</Text>
            </Pressable>
          ) : (
            <View style={styles.qtyBox}>
              <Pressable onPress={handleDec} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable onPress={handleInc} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    flex: 1,
  },
  discountTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.saleBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
    zIndex: 1,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageWrap: { aspectRatio: 1, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  body: { padding: 10 },
  etaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  etaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 4 },
  etaText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  name: { fontSize: fontSize.md, color: colors.text, fontWeight: '500', minHeight: 36 },
  unit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  mrp: { fontSize: fontSize.xs, color: colors.textLight, textDecorationLine: 'line-through' },
  addBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft + '88',
  },
  addText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  qtyValue: { color: '#fff', fontWeight: '700', minWidth: 20, textAlign: 'center' },
});

import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  const imageCount = product.images?.length || 0;
  const soldOut = (product.stock ?? 0) <= 0;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow.card, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      {discount > 0 && !soldOut && (
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      )}

      {imageCount > 1 && (
        <View style={styles.imageCount}>
          <Ionicons name="images" size={10} color="#fff" />
          <Text style={styles.imageCountText}>{imageCount}</Text>
        </View>
      )}

      <View style={styles.imageWrap}>
        {product.images?.[0] ? (
          <Image
            source={{ uri: product.images[0] }}
            style={[styles.image, soldOut && styles.imageDimmed]}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.textLight} />
          </View>
        )}
        {soldOut && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Ionicons name="alert-circle" size={12} color="#fff" />
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.etaRow}>
          <Ionicons name="flash" size={10} color={colors.success} />
          <Text style={styles.etaText}>{product.deliveryEtaMins || 10} mins</Text>
        </View>

        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        {lowStock && (
          <View style={styles.lowStockChip}>
            <Ionicons name="time-outline" size={10} color={colors.warning} />
            <Text style={styles.lowStockText}>Only {product.stock} left</Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, soldOut && { color: colors.textLight }]}>{inr(product.price)}</Text>
              {discount > 0 && <Text style={styles.mrp}>{inr(product.mrp)}</Text>}
            </View>
          </View>

          {soldOut ? (
            <View style={styles.notifyBtn}>
              <Text style={styles.notifyText}>Sold out</Text>
            </View>
          ) : qty === 0 ? (
            <Pressable onPress={handleAdd} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.addText}>ADD</Text>
            </Pressable>
          ) : (
            <View style={styles.qtyBox}>
              <Pressable onPress={handleDec} style={styles.qtyBtn} hitSlop={6}>
                <Ionicons name="remove" size={16} color="#fff" />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable
                onPress={handleInc}
                style={[styles.qtyBtn, qty >= product.stock && { opacity: 0.4 }]}
                hitSlop={6}
                disabled={qty >= product.stock}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </Pressable>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  discountTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.saleBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    zIndex: 1,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  imageCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 1,
  },
  imageCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageWrap: { aspectRatio: 1, backgroundColor: colors.surface, padding: 8, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageDimmed: { opacity: 0.35 },
  imagePlaceholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  soldOutOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  soldOutText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  body: { padding: 10 },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  etaText: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: '700' },
  name: { fontSize: fontSize.md, color: colors.text, fontWeight: '600', minHeight: 36 },
  unit: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  price: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  mrp: { fontSize: fontSize.xs, color: colors.textLight, textDecorationLine: 'line-through' },
  addBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: '#ecfdf5',
    minWidth: 64,
    alignItems: 'center',
  },
  addText: { color: colors.primaryDark, fontWeight: '800', fontSize: fontSize.sm, letterSpacing: 0.5 },
  notifyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 64,
    alignItems: 'center',
  },
  notifyText: { color: colors.textMuted, fontWeight: '800', fontSize: fontSize.sm, letterSpacing: 0.5 },
  lowStockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  lowStockText: { color: '#92400e', fontSize: 10, fontWeight: '700' },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { color: '#fff', fontWeight: '800', minWidth: 20, textAlign: 'center', fontSize: fontSize.sm },
});

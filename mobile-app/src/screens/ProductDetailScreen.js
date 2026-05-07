import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../api/client';
import Button from '../components/Button';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { colors, fontSize, radius } from '../theme';
import { inr } from '../utils/format';

export default function ProductDetailScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuth((s) => s.user);
  const { add, setQty, qtyOf } = useCart();
  const qty = product ? qtyOf(product._id) : 0;

  useEffect(() => {
    api.get(`/products/${route.params.id}`)
      .then(({ data }) => setProduct(data.product))
      .finally(() => setLoading(false));
  }, [route.params.id]);

  if (loading || !product) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleAdd = async () => {
    if (!user) return Alert.alert('Sign in', 'Please log in first.');
    await add(product._id, 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imageBox}>
          {product.images?.[0] && <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />}
          {discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.etaRow}>
            <View style={styles.etaDot} />
            <Text style={styles.etaText}>{product.deliveryEtaMins || 10} mins delivery</Text>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit} · {product.brand}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{inr(product.price)}</Text>
            {discount > 0 && <Text style={styles.mrp}>{inr(product.mrp)}</Text>}
            {discount > 0 && <Text style={styles.youSave}>You save {inr(product.mrp - product.price)}</Text>}
          </View>

          <View style={styles.tagsRow}>
            {product.isVeg && <Tag label="🌱 Veg" color="#10b981" />}
            {product.isOrganic && <Tag label="🌿 Organic" color="#059669" />}
            {product.isBestseller && <Tag label="⭐ Bestseller" color="#f59e0b" />}
            {product.isFeatured && <Tag label="✨ Featured" color="#3b82f6" />}
          </View>

          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>{product.description || 'High-quality grocery item, freshly sourced.'}</Text>

          <View style={styles.infoRow}>
            <InfoCell label="Stock" value={`${product.stock} available`} />
            <InfoCell label="Rating" value={`${product.rating?.toFixed(1) || '—'} ★`} />
            <InfoCell label="Reviews" value={product.reviewCount || 0} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {qty === 0 ? (
          <Button title={`Add to Cart · ${inr(product.price)}`} onPress={handleAdd} />
        ) : (
          <View style={styles.cartRow}>
            <View style={styles.qtyBox}>
              <Button title="−" variant="ghost" onPress={() => setQty(product._id, qty - 1)} style={{ paddingHorizontal: 18 }} />
              <Text style={styles.qtyValue}>{qty}</Text>
              <Button title="+" variant="ghost" onPress={() => setQty(product._id, qty + 1)} style={{ paddingHorizontal: 18 }} />
            </View>
            <Button title="Go to Cart" onPress={() => nav.navigate('Cart')} style={{ flex: 1, marginLeft: 12 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const Tag = ({ label, color }) => (
  <View style={{ backgroundColor: color + '22', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
    <Text style={{ color, fontSize: fontSize.xs, fontWeight: '700' }}>{label}</Text>
  </View>
);

const InfoCell = ({ label, value }) => (
  <View style={styles.infoCell}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageBox: { width: '100%', aspectRatio: 1, backgroundColor: colors.surface, position: 'relative' },
  image: { width: '100%', height: '100%' },
  discountTag: {
    position: 'absolute', top: 16, left: 16, backgroundColor: colors.saleBg,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md,
  },
  discountText: { color: '#fff', fontWeight: '800', fontSize: fontSize.sm },
  content: { padding: 16 },
  etaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  etaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
  etaText: { color: colors.success, fontWeight: '700', fontSize: fontSize.sm },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  unit: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 12, gap: 10 },
  price: { fontSize: 28, fontWeight: '800', color: colors.text },
  mrp: { fontSize: fontSize.md, color: colors.textLight, textDecorationLine: 'line-through' },
  youSave: { fontSize: fontSize.xs, color: colors.success, fontWeight: '700', backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 8 },
  description: { fontSize: fontSize.md, color: colors.textMuted, lineHeight: 22 },
  infoRow: { flexDirection: 'row', marginTop: 24, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16 },
  infoCell: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  infoValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: 4 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  cartRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  qtyValue: { fontSize: fontSize.lg, fontWeight: '800', minWidth: 28, textAlign: 'center' },
});

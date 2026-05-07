import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import Button from '../components/Button';
import ImageCarousel from '../components/ImageCarousel';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { colors, fontSize, radius, shadow } from '../theme';
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

  const badges = [];
  if (discount > 0) badges.push({ label: `${discount}% OFF`, color: colors.danger, icon: 'pricetag' });
  if (product.isBestseller) badges.push({ label: 'BESTSELLER', color: '#f59e0b', icon: 'trophy' });
  if (product.isOrganic) badges.push({ label: 'ORGANIC', color: '#059669', icon: 'leaf' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <ImageCarousel images={product.images || []} badges={badges} />

        <View style={styles.card}>
          <View style={styles.etaRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color="#fff" />
            <Text style={styles.etaText}>{product.deliveryEtaMins || 10} mins delivery</Text>
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.unit}>{product.unit}</Text>
            {product.brand && (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.unit}>{product.brand}</Text>
              </>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{inr(product.price)}</Text>
            {discount > 0 && <Text style={styles.mrp}>{inr(product.mrp)}</Text>}
            {discount > 0 && (
              <View style={styles.savePill}>
                <Ionicons name="trending-down" size={11} color={colors.success} />
                <Text style={styles.savePillText}>Save {inr(product.mrp - product.price)}</Text>
              </View>
            )}
          </View>

          {(product.rating > 0 || product.reviewCount > 0) && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.ratingPillText}>{product.rating?.toFixed(1) || '—'}</Text>
              </View>
              <Text style={styles.ratingMeta}>{product.reviewCount} reviews</Text>
            </View>
          )}

          <View style={styles.tagsRow}>
            {product.isVeg && <Tag icon="leaf" label="Veg" color={colors.success} />}
            {product.isVeg === false && <Tag icon="restaurant" label="Non-veg" color={colors.danger} />}
            {product.isOrganic && <Tag icon="flower" label="Organic" color="#059669" />}
            {product.isFeatured && <Tag icon="sparkles" label="Featured" color={colors.info} />}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.description}>
            {product.description || 'High-quality grocery item, freshly sourced.'}
          </Text>

          <View style={styles.infoGrid}>
            <InfoCell icon="cube-outline" label="In stock" value={`${product.stock}`} />
            <InfoCell icon="star-outline" label="Rating" value={`${product.rating?.toFixed(1) || '—'}`} />
            <InfoCell icon="people-outline" label="Reviews" value={`${product.reviewCount || 0}`} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why shop with us</Text>
          <FeatureRow icon="shield-checkmark" title="100% genuine" subtitle="Sourced from trusted brands" />
          <FeatureRow icon="time" title="10-min delivery" subtitle="From our local store to your door" />
          <FeatureRow icon="refresh" title="Easy returns" subtitle="Issue with your order? Hassle-free refund" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {qty === 0 ? (
          <Button title={`Add to Cart  ·  ${inr(product.price)}`} onPress={handleAdd} />
        ) : (
          <View style={styles.cartRow}>
            <View style={styles.qtyBox}>
              <Pressable onPress={() => setQty(product._id, qty - 1)} style={styles.qtyBtn}>
                <Ionicons name="remove" size={18} color={colors.text} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable onPress={() => setQty(product._id, qty + 1)} style={styles.qtyBtn}>
                <Ionicons name="add" size={18} color={colors.text} />
              </Pressable>
            </View>
            <Button title="Go to Cart" onPress={() => nav.navigate('Cart')} style={{ flex: 1, marginLeft: 12 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const Tag = ({ icon, label, color }) => (
  <View style={[styles.tag, { backgroundColor: color + '18' }]}>
    <Ionicons name={icon} size={12} color={color} />
    <Text style={[styles.tagText, { color }]}>{label}</Text>
  </View>
);

const InfoCell = ({ icon, label, value }) => (
  <View style={styles.infoCell}>
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

const FeatureRow = ({ icon, title, subtitle }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 16, marginTop: 8, ...shadow.card },
  etaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.sm, alignSelf: 'flex-start', marginBottom: 10,
  },
  etaText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  unit: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  dot: { color: colors.textLight },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 14, gap: 10 },
  price: { fontSize: 28, fontWeight: '800', color: colors.text },
  mrp: { fontSize: fontSize.md, color: colors.textLight, textDecorationLine: 'line-through' },
  savePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  savePillText: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.success,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  ratingPillText: { color: '#fff', fontWeight: '800', fontSize: fontSize.xs },
  ratingMeta: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: fontSize.xs, fontWeight: '700' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: 10 },
  description: { fontSize: fontSize.md, color: colors.textMuted, lineHeight: 22 },
  infoGrid: { flexDirection: 'row', marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14 },
  infoCell: { flex: 1, alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  infoValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  featureSubtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border,
  },
  cartRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
  },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  qtyValue: { fontSize: fontSize.lg, fontWeight: '800', minWidth: 28, textAlign: 'center' },
});

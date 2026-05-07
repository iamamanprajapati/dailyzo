import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import ProductCard from '../components/ProductCard';
import CartFooter from '../components/CartFooter';
import { colors, fontSize, radius, spacing, shadow } from '../theme';

export default function HomeScreen() {
  const nav = useNavigation();
  const user = useAuth((s) => s.user);
  const loadCart = useCart((s) => s.load);

  const [categories, setCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [{ data: catData }, { data: bestData }, { data: feaData }] = await Promise.all([
        api.get('/categories'),
        api.get('/products', { params: { isBestseller: true, limit: 10 } }),
        api.get('/products', { params: { isFeatured: true, limit: 10 } }),
      ]);
      setCategories(catData.categories);
      setBestsellers(bestData.products);
      setFeatured(feaData.products);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (user) loadCart();
  }, [load, user, loadCart]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LinearGradient colors={['#dbeafe', '#fff']} style={styles.header}>
          <View style={styles.deliveryRow}>
            <View>
              <Text style={styles.eta}>⚡ 10 mins</Text>
              <Text style={styles.address} numberOfLines={1}>
                🏠 Home · {user?.addresses?.[0]?.line1 || 'Add your address'}
              </Text>
            </View>
            <Pressable style={styles.avatar} onPress={() => nav.navigate('Account')}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.searchBar} onPress={() => nav.navigate('Search')}>
            <Text style={styles.searchPlaceholder}>🔍  Search for 'milk', 'eggs', 'mango'…</Text>
          </Pressable>
        </LinearGradient>

        <View style={[styles.banner, shadow.card]}>
          <LinearGradient colors={['#fb923c', '#f59e0b']} style={styles.bannerGrad}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerEyebrow}>MANGO OF THE WEEK</Text>
              <Text style={styles.bannerTitle}>Gujarat's Kesar,{'\n'}The Saffron Star</Text>
              <Pressable style={styles.bannerCta}>
                <Text style={styles.bannerCtaText}>Shop now  →</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 80 }}>🥭</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Shop by category</Text>
        <View style={styles.categoryGrid}>
          {categories.slice(0, 8).map((c) => (
            <Pressable
              key={c._id}
              style={styles.catItem}
              onPress={() => nav.navigate('CategoryProducts', { category: c })}
            >
              <View style={styles.catImageWrap}>
                {c.image ? (
                  <Image source={{ uri: c.image }} style={styles.catImage} />
                ) : (
                  <Text style={{ fontSize: 30 }}>🛍️</Text>
                )}
              </View>
              <Text style={styles.catName} numberOfLines={2}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        {bestsellers.length > 0 && (
          <ProductRow title="Bestsellers" products={bestsellers} onSeeAll={() => nav.navigate('Search', { isBestseller: true })} />
        )}

        {featured.length > 0 && (
          <ProductRow title="Featured" products={featured} />
        )}
      </ScrollView>

      <CartFooter />
    </View>
  );
}

function ProductRow({ title, products, onSeeAll }) {
  const nav = useNavigation();
  return (
    <View style={{ marginTop: 24 }}>
      <View style={styles.rowHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && <Pressable onPress={onSeeAll}><Text style={styles.seeAll}>See all  →</Text></Pressable>}
      </View>
      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
        renderItem={({ item }) => (
          <View style={{ width: 160 }}>
            <ProductCard product={item} onPress={() => nav.navigate('ProductDetail', { id: item._id })} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eta: { fontWeight: '800', fontSize: fontSize.xl, color: colors.text },
  address: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2, maxWidth: 240 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: radius.lg, ...shadow.card,
  },
  searchPlaceholder: { color: colors.textMuted, fontSize: fontSize.md },
  banner: { marginHorizontal: 12, marginTop: 14, borderRadius: radius.xl, overflow: 'hidden' },
  bannerGrad: { padding: 16, flexDirection: 'row', alignItems: 'center', minHeight: 120 },
  bannerEyebrow: { color: '#fff', fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.5 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 },
  bannerCta: { backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, alignSelf: 'flex-start', marginTop: 12 },
  bannerCtaText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  catItem: { width: '25%', alignItems: 'center', padding: 8 },
  catImageWrap: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: colors.primarySoft + '60',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  catImage: { width: '100%', height: '100%' },
  catName: { fontSize: fontSize.xs, color: colors.text, textAlign: 'center', marginTop: 6, fontWeight: '500' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  seeAll: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm, marginTop: 20 },
});

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Image, Pressable, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import api from '../api/client';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import ProductCard from '../components/ProductCard';
import CartFooter from '../components/CartFooter';
import { colors, fontSize, radius, shadow } from '../theme';

export default function HomeScreen() {
  const nav = useNavigation();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const loadCart = useCart((s) => s.load);

  const [categories, setCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

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

  const detectLocation = async () => {
    if (!user) return Alert.alert('Sign in', 'Please log in first.');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location access in settings to auto-detect your address.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = places?.[0];
      if (!place) {
        Alert.alert('Could not detect', 'Please add your address manually.');
        return;
      }
      const draft = {
        line1: [place.name, place.street].filter(Boolean).join(', ') || 'Current location',
        line2: place.district || place.subregion || '',
        city: place.city || place.region || '',
        state: place.region || '',
        pincode: place.postalCode || '',
        location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] },
      };
      nav.navigate('AddAddress', { draft });
    } catch (err) {
      Alert.alert('Location error', err.message || 'Could not fetch location');
    } finally {
      setLocating(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LinearGradient colors={['#dcfce7', '#fff']} style={styles.header}>
          <View style={styles.deliveryRow}>
            <Pressable style={{ flex: 1 }} onPress={detectLocation}>
              <View style={styles.etaPill}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#fff" />
                <Text style={styles.etaPillText}>10 mins</Text>
              </View>
              <View style={styles.addressRow}>
                <Ionicons name="location-sharp" size={16} color={colors.text} />
                <Text style={styles.address} numberOfLines={1}>
                  {defaultAddr ? `${defaultAddr.label} · ${defaultAddr.line1}` : 'Tap to detect location'}
                </Text>
                {locating
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons name="chevron-down" size={16} color={colors.textMuted} />}
              </View>
            </Pressable>
            <Pressable style={styles.avatar} onPress={() => nav.navigate('Account')}>
              <Text style={{ color: colors.primaryDark, fontWeight: '800', fontSize: 16 }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </Pressable>
          </View>

          <Pressable style={[styles.searchBar, shadow.card]} onPress={() => nav.navigate('Search')}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <Text style={styles.searchPlaceholder}>Search 'milk', 'eggs', 'mango'…</Text>
            <View style={styles.micBox}>
              <Ionicons name="mic-outline" size={16} color={colors.primary} />
            </View>
          </Pressable>
        </LinearGradient>

        <View style={[styles.banner, shadow.card]}>
          <LinearGradient colors={['#fb923c', '#f59e0b']} style={styles.bannerGrad}>
            <View style={{ flex: 1 }}>
              <View style={styles.bannerEyebrowRow}>
                <Ionicons name="flame" size={12} color="#fff" />
                <Text style={styles.bannerEyebrow}>MANGO OF THE WEEK</Text>
              </View>
              <Text style={styles.bannerTitle}>Gujarat's Kesar,{'\n'}The Saffron Star</Text>
              <Pressable style={styles.bannerCta}>
                <Text style={styles.bannerCtaText}>Shop now</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 80 }}>🥭</Text>
          </LinearGradient>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <Pressable onPress={() => nav.navigate('Tabs', { screen: 'Categories' })}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.categoryGrid}>
          {categories.slice(0, 8).map((c) => (
            <Pressable
              key={c._id}
              style={styles.catItem}
              onPress={() => nav.navigate('CategoryProducts', { category: c })}
            >
              <View style={[styles.catImageWrap, shadow.card]}>
                {c.image ? (
                  <Image source={{ uri: c.image }} style={styles.catImage} />
                ) : (
                  <Ionicons name="basket-outline" size={28} color={colors.primary} />
                )}
              </View>
              <Text style={styles.catName} numberOfLines={2}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        {bestsellers.length > 0 && (
          <ProductRow title="Bestsellers" icon="trophy" products={bestsellers} onSeeAll={() => nav.navigate('Search', { isBestseller: true })} />
        )}

        {featured.length > 0 && (
          <ProductRow title="Featured" icon="sparkles" products={featured} />
        )}
      </ScrollView>

      <CartFooter />
    </View>
  );
}

function ProductRow({ title, icon, products, onSeeAll }) {
  const nav = useNavigation();
  return (
    <View style={{ marginTop: 24 }}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
          <Text style={styles.sectionTitleInline}>{title}</Text>
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} style={styles.seeAllRow}>
            <Text style={styles.seeAll}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        )}
      </View>
      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
        renderItem={({ item }) => (
          <View style={{ width: 165 }}>
            <ProductCard product={item} onPress={() => nav.navigate('ProductDetail', { id: item._id })} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  etaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm, alignSelf: 'flex-start',
  },
  etaPillText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  address: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600', flex: 1 },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  searchBar: {
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  searchPlaceholder: { color: colors.textMuted, fontSize: fontSize.md, flex: 1 },
  micBox: { padding: 4, borderRadius: 999, backgroundColor: colors.primarySoft },
  banner: { marginHorizontal: 12, marginTop: 14, borderRadius: radius.xl, overflow: 'hidden' },
  bannerGrad: { padding: 16, flexDirection: 'row', alignItems: 'center', minHeight: 120 },
  bannerEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bannerEyebrow: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1.5 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 },
  bannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: 12,
  },
  bannerCtaText: { color: '#fff', fontWeight: '700' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  sectionTitleInline: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  seeAll: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  catItem: { width: '25%', alignItems: 'center', padding: 8 },
  catImageWrap: {
    width: 70, height: 70, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, padding: 6,
  },
  catImage: { width: '100%', height: '100%', borderRadius: 12 },
  catName: { fontSize: fontSize.xs, color: colors.text, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  rowHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10,
  },
  rowTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});

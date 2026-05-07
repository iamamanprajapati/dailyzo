import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../api/client';
import ProductCard from '../components/ProductCard';
import CartFooter from '../components/CartFooter';
import { colors, fontSize } from '../theme';

export default function CategoryProductsScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const { category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products', { params: { category: category._id, limit: 60 } })
      .then(({ data }) => setProducts(data.products))
      .finally(() => setLoading(false));
    nav.setOptions({ title: category.name });
  }, [category, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="package-variant" size={14} color={colors.textMuted} />
          <Text style={styles.headerSub}>{products.length} products</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="time-outline" size={14} color={colors.success} />
          <Text style={[styles.headerSub, { color: colors.success, fontWeight: '700' }]}>10 min delivery</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p._id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} onPress={() => nav.navigate('ProductDetail', { id: item._id })} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No products in this category yet</Text>
            </View>
          }
        />
      )}
      <CartFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  headerInfo: { padding: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  headerSub: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  dot: { color: colors.textLight, marginHorizontal: 2 },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { color: colors.textMuted, marginTop: 12, fontSize: fontSize.md, fontWeight: '600' },
});

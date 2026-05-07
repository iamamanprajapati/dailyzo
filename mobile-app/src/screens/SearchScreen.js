import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import CartFooter from '../components/CartFooter';
import { colors, fontSize, radius } from '../theme';

export default function SearchScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const [q, setQ] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (query, params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { q: query, limit: 60, ...params } });
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route.params?.isBestseller) search('', { isBestseller: true });
    else search('');
  }, [route.params?.isBestseller]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="🔍  Search for products…"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => search(q)}
          autoFocus
          returnKeyType="search"
        />
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
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        />
      )}
      <CartFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { padding: 12, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: colors.border },
  input: {
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: radius.md, fontSize: fontSize.md,
  },
  empty: { textAlign: 'center', color: colors.textMuted, padding: 40 },
});

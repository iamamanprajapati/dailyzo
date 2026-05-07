import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../api/client';
import ProductCard from '../components/ProductCard';
import CartFooter from '../components/CartFooter';
import { colors, fontSize, radius, shadow } from '../theme';

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
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.searchBar}>
        <View style={[styles.input, shadow.card]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.inputText}
            placeholder="Search for products…"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => search(q)}
            autoFocus
            returnKeyType="search"
            placeholderTextColor={colors.textLight}
          />
          {q.length > 0 && (
            <Pressable onPress={() => { setQ(''); search(''); }} hitSlop={6}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </Pressable>
          )}
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
              <Ionicons name="search-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}
      <CartFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { padding: 12, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: colors.border },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff',
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  inputText: { flex: 1, fontSize: fontSize.md, color: colors.text },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: 12, fontWeight: '600' },
});

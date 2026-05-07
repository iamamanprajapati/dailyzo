import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../api/client';
import { colors, fontSize, radius, shadow } from '../theme';

export default function CategoriesScreen() {
  const nav = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.header}>
        <Text style={styles.title}>All Categories</Text>
        <Text style={styles.subtitle}>{categories.length} categories · everything you need</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(c) => c._id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={() => nav.navigate('CategoryProducts', { category: item })}
          >
            <View style={styles.imageBox}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} />
              ) : (
                <Ionicons name="basket-outline" size={36} color={colors.primary} />
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <View style={styles.exploreRow}>
                <Text style={styles.explore}>Explore</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: .5,
    borderColor: colors.border,
  },
  imageBox: {
    width: '100%', aspectRatio: 1.4,
    backgroundColor: colors.primarySoft + '40',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  cardBody: { padding: 12 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, minHeight: 36 },
  exploreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  explore: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '700' },
});

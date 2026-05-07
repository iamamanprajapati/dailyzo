import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { colors, fontSize, radius } from '../theme';

export default function CategoriesScreen() {
  const nav = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
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
            style={styles.card}
            onPress={() => nav.navigate('CategoryProducts', { category: item })}
          >
            <View style={styles.imageBox}>
              {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            </View>
            <Text style={styles.name}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: colors.bg, borderBottomWidth: 1, borderColor: colors.border },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageBox: {
    width: '100%', aspectRatio: 1, borderRadius: radius.md,
    backgroundColor: colors.primarySoft + '40', overflow: 'hidden', marginBottom: 8,
  },
  image: { width: '100%', height: '100%' },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, textAlign: 'center' },
});

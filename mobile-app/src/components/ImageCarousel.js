import { useRef, useState } from 'react';
import { View, FlatList, Image, Dimensions, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ImageCarousel({ images = [], height, badges = [] }) {
  const listRef = useRef(null);
  const [active, setActive] = useState(0);

  const data = images.length > 0 ? images : [null];
  const itemWidth = SCREEN_W;
  const itemHeight = height || SCREEN_W;

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
    if (idx !== active) setActive(idx);
  };

  const goTo = (idx) => {
    listRef.current?.scrollToOffset({ offset: idx * itemWidth, animated: true });
  };

  return (
    <View style={[styles.wrap, { height: itemHeight }]}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth, height: itemHeight, backgroundColor: '#fff' }}>
            {item ? (
              <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={[styles.image, styles.empty]}>
                <Ionicons name="image-outline" size={64} color={colors.textLight} />
              </View>
            )}
          </View>
        )}
      />

      {badges.length > 0 && (
        <View style={styles.badgeStack}>
          {badges.map((b, i) => (
            <View key={i} style={[styles.badge, { backgroundColor: b.color || colors.primary }]}>
              {b.icon && <Ionicons name={b.icon} size={12} color="#fff" />}
              <Text style={styles.badgeText}>{b.label}</Text>
            </View>
          ))}
        </View>
      )}

      {data.length > 1 && (
        <>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {active + 1} / {data.length}
            </Text>
          </View>

          <View style={styles.dots}>
            {data.map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
                <View style={[styles.dot, i === active && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: '#fff', position: 'relative' },
  image: { width: '100%', height: '100%' },
  empty: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  badgeStack: {
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    ...shadow.card,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
});

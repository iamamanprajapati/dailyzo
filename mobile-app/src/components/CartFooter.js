import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSize, radius, shadow } from '../theme';
import { useCart } from '../store/cart';
import { inr } from '../utils/format';

export default function CartFooter() {
  const navigation = useNavigation();
  const { cart, count } = useCart();
  const total = count();
  if (total === 0) return null;
  const freeDelivery = cart.subtotal >= 199;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.navigate('Cart')} style={({ pressed }) => [styles.bar, shadow.glow, pressed && { opacity: 0.95 }]}>
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Ionicons name="cart" size={18} color="#fff" />
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{total}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.title}>{total} item{total > 1 ? 's' : ''} · {inr(cart.subtotal)}</Text>
            <Text style={styles.subtitle}>
              {freeDelivery ? 'Free delivery unlocked' : `Add ${inr(199 - cart.subtotal)} for free delivery`}
            </Text>
          </View>
        </View>
        <View style={styles.viewCart}>
          <Text style={styles.viewCartText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  bar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { color: colors.primaryDark, fontWeight: '800', fontSize: 10 },
  title: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  subtitle: { color: '#bbf7d0', fontSize: fontSize.xs, marginTop: 2 },
  viewCart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md,
  },
  viewCartText: { color: '#fff', fontWeight: '800', fontSize: fontSize.sm },
});

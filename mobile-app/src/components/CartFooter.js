import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fontSize, radius } from '../theme';
import { useCart } from '../store/cart';
import { inr } from '../utils/format';

export default function CartFooter() {
  const navigation = useNavigation();
  const { cart, count } = useCart();
  const total = count();
  if (total === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.navigate('Cart')} style={styles.bar}>
        <View>
          <Text style={styles.title}>{total} item{total > 1 ? 's' : ''} · {inr(cart.subtotal)}</Text>
          <Text style={styles.subtitle}>You unlocked free delivery!</Text>
        </View>
        <View style={styles.viewCart}>
          <Text style={styles.viewCartText}>View Cart  →</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  subtitle: { color: '#d1fae5', fontSize: fontSize.xs, marginTop: 2 },
  viewCart: { backgroundColor: '#ffffff20', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  viewCartText: { color: '#fff', fontWeight: '700' },
});

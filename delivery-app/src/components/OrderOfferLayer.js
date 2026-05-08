import { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../api/client';
import { getSocket } from '../api/socket';
import { colors, fontSize, radius, shadow } from '../theme';
import { inr } from '../utils/format';

export default function OrderOfferLayer() {
  const nav = useNavigation();
  const [queue, setQueue] = useState([]);
  const [accepting, setAccepting] = useState(false);

  const top = queue[0];

  useEffect(() => {
    const socket = getSocket();
    const onOffer = (payload) => {
      if (!payload?.orderId) return;
      setQueue((q) => {
        if (q.some((o) => o.orderId === payload.orderId)) return q;
        return [...q, payload];
      });
    };
    const onWithdraw = ({ orderId }) => {
      if (!orderId) return;
      const sid = String(orderId);
      setQueue((q) => q.filter((o) => String(o.orderId) !== sid));
    };
    socket.on('order:offer', onOffer);
    socket.on('order:offer:withdraw', onWithdraw);
    return () => {
      socket.off('order:offer', onOffer);
      socket.off('order:offer:withdraw', onWithdraw);
    };
  }, []);

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const accept = async () => {
    if (!top) return;
    setAccepting(true);
    try {
      await api.post(`/orders/${top.orderId}/accept`);
      const oid = top.orderId;
      setQueue((q) => q.slice(1));
      nav.navigate('ActiveOrder', { orderId: oid });
    } catch (err) {
      Alert.alert('Unable to accept', err.response?.data?.message || err.message || 'Try again');
      dismiss();
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Modal visible={!!top} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, shadow.big]}>
          <View style={styles.badge}>
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.badgeText}>NEW ORDER NEARBY</Text>
          </View>
          <Text style={styles.orderNo}>{top?.orderNumber}</Text>
          <Text style={styles.amount}>
            {inr(top?.total ?? 0)} · {top?.itemsCount ?? 0} items
          </Text>
          <Text style={styles.hint}>First partner to accept gets this delivery. Others will be notified when it’s taken.</Text>
          <View style={styles.actions}>
            <Pressable style={styles.decline} onPress={dismiss} disabled={accepting}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable style={styles.accept} onPress={accept} disabled={accepting}>
              {accepting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.acceptText}>Accept</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  badgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.5 },
  orderNo: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 6,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  decline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  declineText: { fontWeight: '800', color: colors.textMuted, fontSize: fontSize.md },
  accept: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  acceptText: { fontWeight: '800', color: '#fff', fontSize: fontSize.md },
});

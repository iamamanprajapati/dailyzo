import { create } from 'zustand';
import api from '../api/client';

export const useCart = create((set, get) => ({
  cart: { items: [], subtotal: 0, mrpTotal: 0 },
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.cart });
    } catch {
      set({ cart: { items: [], subtotal: 0, mrpTotal: 0 } });
    } finally {
      set({ loading: false });
    }
  },

  add: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    set({ cart: data.cart });
  },

  setQty: async (productId, quantity) => {
    const { data } = await api.put('/cart/items', { productId, quantity });
    set({ cart: data.cart });
  },

  remove: async (productId) => {
    const { data } = await api.delete(`/cart/items/${productId}`);
    set({ cart: data.cart });
  },

  clear: async () => {
    const { data } = await api.delete('/cart');
    set({ cart: data.cart });
  },

  qtyOf: (productId) => {
    const item = get().cart.items.find((i) => (i.product?._id || i.product) === productId);
    return item?.quantity || 0;
  },

  count: () => get().cart.items.reduce((s, i) => s + i.quantity, 0),
}));

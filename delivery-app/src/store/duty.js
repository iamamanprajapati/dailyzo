import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useDuty = create(
  persist(
    (set) => ({
      isOnDuty: false,
      isAvailable: true,
      setDuty: (isOnDuty) => set({ isOnDuty }),
      setAvailable: (isAvailable) => set({ isAvailable }),
    }),
    {
      name: 'dailyzo-rider-duty',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

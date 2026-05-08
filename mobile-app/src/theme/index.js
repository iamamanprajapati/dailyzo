export const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primarySoft: '#d1fae5',
  bg: '#ffffff',
  surface: '#f8fafc',
  surfaceAlt: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  saleBg: '#10b981',
  bannerBg: '#dbeafe',
};

export const spacing = (n) => n * 4;

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };

export const fontSize = { xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, hero: 28 };

export const shadow = {
  card: {
    elevation: 3,
  },
  big: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

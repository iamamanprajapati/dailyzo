export const inr = (n) => `₹${Math.round(n || 0)}`;

export const dateShort = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const dateTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const statusLabel = (s) => (s || '').replace(/_/g, ' ');

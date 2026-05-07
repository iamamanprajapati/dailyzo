import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style, textStyle, children }) {
  const palette = {
    primary: { bg: colors.primary, fg: '#fff', press: colors.primaryDark },
    secondary: { bg: '#f1f5f9', fg: colors.text, press: '#e2e8f0' },
    outline: { bg: '#fff', fg: colors.primary, press: colors.primarySoft, border: colors.primary },
    danger: { bg: colors.danger, fg: '#fff', press: '#dc2626' },
    dark: { bg: colors.bg, fg: '#fff', press: '#1e293b' },
    ghost: { bg: 'transparent', fg: colors.text, press: '#f1f5f9' },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: pressed ? palette.press : palette.bg },
        palette.border && { borderWidth: 1.5, borderColor: palette.border },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : children ? (
        children
      ) : (
        <Text style={[styles.text, { color: palette.fg }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: fontSize.lg, fontWeight: '700' },
});

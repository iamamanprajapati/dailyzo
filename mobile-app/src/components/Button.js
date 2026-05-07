import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../theme';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style, textStyle }) {
  const palette = {
    primary: { bg: colors.primary, fg: '#fff', press: colors.primaryDark },
    secondary: { bg: colors.surfaceAlt, fg: colors.text, press: colors.border },
    outline: { bg: '#fff', fg: colors.primary, press: colors.primarySoft, border: colors.primary },
    danger: { bg: colors.danger, fg: '#fff', press: '#dc2626' },
    ghost: { bg: 'transparent', fg: colors.text, press: colors.surfaceAlt },
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
  text: { fontSize: fontSize.lg, fontWeight: '600' },
});

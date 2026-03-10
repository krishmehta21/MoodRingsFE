import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface WarmButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const WarmButton: React.FC<WarmButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryButton, { backgroundColor: colors.bgTag }];
      case 'outline':
        return [styles.outlineButton, { borderColor: colors.accent }];
      default:
        return [styles.primaryButton, { backgroundColor: colors.accent }];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return { color: colors.textPrimary };
      case 'outline':
        return { color: colors.accent };
      default:
        return { color: colors.bgPrimary };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        ...([getButtonStyle()] as any),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.accent : colors.bgPrimary} />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    ...Theme.shadows.soft,
  },
  secondaryButton: {},
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

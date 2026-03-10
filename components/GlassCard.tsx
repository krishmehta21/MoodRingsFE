import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Platform } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  alwaysDark?: boolean;
}

export function GlassCard({ children, style, alwaysDark = false }: GlassCardProps) {
  const { colors, isDark } = useTheme();


  const useDark = alwaysDark || isDark;

  const cardStyle = {
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: isDark ? '#000' : colors.textPrimary,
    shadowOpacity: isDark ? 0.35 : 0.05,
    elevation: isDark ? 6 : 2,
    marginHorizontal: 16,
  };

  if (useDark) {
    return (
      <View style={[styles.innerCard, style]}>
        <View style={styles.contentDark}>
          {children}
        </View>
      </View>
    );
  }


  return (
    <View style={[cardStyle, style, { shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }]}>
      <View style={{ padding: 20 }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    // @ts-ignore
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
  },

  contentDark: {
    padding: 20,
  },
});
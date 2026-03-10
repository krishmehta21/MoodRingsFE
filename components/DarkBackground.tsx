import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export function DarkBackground({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();

  const gradientColors = [colors.bgPrimary, colors.bgSecondary, colors.bgTertiary];

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'visible',
  },
});

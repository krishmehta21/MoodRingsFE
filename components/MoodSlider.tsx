import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface MoodSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  hideLabels?: boolean;
}

export const MoodSlider: React.FC<MoodSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 10,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
  hideLabels = false,
}) => {
  const { colors } = useTheme();

  const handleValueChange = (newValue: number) => {
    const roundedValue = Math.round(newValue);
    if (roundedValue !== value) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // silently fail on unsupported platforms
      }
      onValueChange(roundedValue);
    }
  };

  return (
    <View style={styles.container}>
      {!hideLabels && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Low</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>High</Text>
        </View>
      )}
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={1}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={minimumTrackTintColor || colors.accent}
        maximumTrackTintColor={maximumTrackTintColor || colors.borderDefault}
        thumbTintColor={thumbTintColor || colors.accent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: Theme.spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

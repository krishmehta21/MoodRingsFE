import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Theme } from '../constants/theme';

interface MoodSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
}

export const MoodSlider: React.FC<MoodSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 10,
}) => {
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
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Low</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>High</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={1}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={Theme.colors.accent}
        maximumTrackTintColor={Theme.colors.tagBackground}
        thumbTintColor={Theme.colors.accent}
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
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    color: Theme.colors.textPrimary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

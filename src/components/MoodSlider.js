import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Slider from '@react-native-community/slider';

import { getColors, spacing, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';

export default function MoodSlider({
  label,
  value,
  onValueChange,
  minLabel,
  maxLabel,
  minValue = 1,
  maxValue = 10,
  step = 1,
  showValue = true,
}) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);

  const getValueColor = () => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);

    // Gradient from green (good) to red (bad) for anxiety
    // Or from red (bad) to green (good) for overall mood and energy
    if (label === 'Anxiety') {
      // Higher is worse
      if (normalizedValue < 0.3) return colors.severity1;
      if (normalizedValue < 0.5) return colors.severity2;
      if (normalizedValue < 0.7) return colors.severity3;
      if (normalizedValue < 0.9) return colors.severity4;
      return colors.severity5;
    } else {
      // Higher is better
      if (normalizedValue < 0.3) return colors.severity5;
      if (normalizedValue < 0.5) return colors.severity4;
      if (normalizedValue < 0.7) return colors.severity3;
      if (normalizedValue < 0.9) return colors.severity2;
      return colors.severity1;
    }
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showValue && (
          <View style={[styles.valueContainer, { backgroundColor: getValueColor() }]}>
            <Text style={styles.value}>{value}</Text>
          </View>
        )}
      </View>

      <Slider
        style={styles.slider}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.surfaceVariant}
        thumbTintColor={colors.primary}
      />

      <View style={styles.labels}>
        <Text style={styles.minMaxLabel}>{minLabel}</Text>
        <Text style={styles.minMaxLabel}>{maxLabel}</Text>
      </View>
    </Surface>
  );
}

// Simplified version for sleep quality (1-5 scale)
export function SleepQualitySlider({ value, onValueChange }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);

  const qualityLabels = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <Text style={styles.label}>Sleep Quality</Text>
        <View style={[styles.valueContainer, { backgroundColor: colors.accent }]}>
          <Text style={styles.value}>{qualityLabels[value - 1]}</Text>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.surfaceVariant}
        thumbTintColor={colors.accent}
      />

      <View style={styles.qualityMarkers}>
        {qualityLabels.map((label, index) => (
          <Text
            key={label}
            style={[
              styles.qualityMarker,
              index === value - 1 && { color: colors.accent, fontWeight: 'bold' },
            ]}
          >
            {index + 1}
          </Text>
        ))}
      </View>
    </Surface>
  );
}

// Sleep hours input
export function SleepHoursSlider({ value, onValueChange }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <Text style={styles.label}>Hours of Sleep</Text>
        <View style={[styles.valueContainer, { backgroundColor: colors.accent }]}>
          <Text style={styles.value}>{value.toFixed(1)} hrs</Text>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={12}
        step={0.5}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.surfaceVariant}
        thumbTintColor={colors.accent}
      />

      <View style={styles.labels}>
        <Text style={styles.minMaxLabel}>0 hrs</Text>
        <Text style={styles.minMaxLabel}>12 hrs</Text>
      </View>
    </Surface>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  valueContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minMaxLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  qualityMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  qualityMarker: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

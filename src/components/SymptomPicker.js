import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text, Surface } from 'react-native-paper';

import { getColors, spacing, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { SYMPTOMS, SEVERITY_LABELS } from '../utils/constants';

export default function SymptomPicker({ selectedSymptoms, onSymptomsChange }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);

  const isSelected = (symptomId) => {
    return selectedSymptoms.some((s) => s.symptomId === symptomId);
  };

  const getSymptomSeverity = (symptomId) => {
    const symptom = selectedSymptoms.find((s) => s.symptomId === symptomId);
    return symptom ? symptom.severity : 0;
  };

  const toggleSymptom = (symptomId) => {
    if (isSelected(symptomId)) {
      onSymptomsChange(selectedSymptoms.filter((s) => s.symptomId !== symptomId));
    } else {
      onSymptomsChange([...selectedSymptoms, { symptomId, severity: 3 }]);
    }
  };

  const setSeverity = (symptomId, severity) => {
    onSymptomsChange(
      selectedSymptoms.map((s) =>
        s.symptomId === symptomId ? { ...s, severity } : s
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.symptomsGrid}>
        {SYMPTOMS.map((symptom) => {
          const selected = isSelected(symptom.id);
          const severity = getSymptomSeverity(symptom.id);
          const severityColor = selected
            ? SEVERITY_LABELS[severity - 1]?.color
            : colors.surfaceVariant;

          return (
            <Surface
              key={symptom.id}
              style={[
                styles.symptomCard,
                selected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              elevation={selected ? 2 : 1}
            >
              <Chip
                mode={selected ? 'flat' : 'outlined'}
                selected={selected}
                onPress={() => toggleSymptom(symptom.id)}
                style={[
                  styles.symptomChip,
                  selected && { backgroundColor: severityColor },
                ]}
                textStyle={styles.symptomChipText}
              >
                {symptom.name}
              </Chip>

              {selected && (
                <View style={styles.severityContainer}>
                  <Text style={styles.severityLabel}>Severity:</Text>
                  <View style={styles.severityButtons}>
                    {SEVERITY_LABELS.map((level) => (
                      <Chip
                        key={level.value}
                        mode={severity === level.value ? 'flat' : 'outlined'}
                        selected={severity === level.value}
                        onPress={() => setSeverity(symptom.id, level.value)}
                        style={[
                          styles.severityChip,
                          severity === level.value && {
                            backgroundColor: level.color,
                          },
                        ]}
                        textStyle={styles.severityChipText}
                        compact
                      >
                        {level.value}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </Surface>
          );
        })}
      </View>

      {selectedSymptoms.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symptomCard: {
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    backgroundColor: colors.surface,
  },
  symptomChip: {
    marginBottom: spacing.xs,
  },
  symptomChipText: {
    fontSize: 13,
  },
  severityContainer: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  severityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  severityChip: {
    height: 28,
  },
  severityChipText: {
    fontSize: 11,
    marginHorizontal: 0,
  },
  summary: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

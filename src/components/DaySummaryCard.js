import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import { SYMPTOMS, PERIOD_FLOW_OPTIONS } from '../utils/constants';

export default function DaySummaryCard({
  date,
  logData,
  isPeriodDay,
  onPress,
  colors
}) {
  const styles = createStyles(colors);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dateObj - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get period flow info
  const getFlowInfo = () => {
    if (!logData?.period_flow || logData.period_flow === 'none') {
      if (isPeriodDay) {
        return { label: 'Period day', color: colors.calendarPeriod };
      }
      return null;
    }
    const flow = PERIOD_FLOW_OPTIONS.find(f => f.value === logData.period_flow);
    return flow ? { label: flow.label + ' flow', color: flow.color } : null;
  };

  // Get symptom names from logged symptoms
  const getSymptomNames = () => {
    if (!logData?.symptoms || logData.symptoms.length === 0) return [];
    return logData.symptoms.map(s => {
      const symptom = SYMPTOMS.find(sym => sym.id === s.symptom_id);
      return symptom ? symptom.name : s.symptom_id;
    }).slice(0, 3); // Show max 3 symptoms
  };

  // Get mood emoji based on value (1-10)
  const getMoodEmoji = (value) => {
    if (!value) return null;
    if (value <= 2) return '😢';
    if (value <= 4) return '😕';
    if (value <= 6) return '😐';
    if (value <= 8) return '🙂';
    return '😊';
  };

  const flowInfo = getFlowInfo();
  const symptomNames = getSymptomNames();
  const hasEntry = !!logData;
  const isFuture = date > new Date().toISOString().split('T')[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with date and edit indicator */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <MaterialCommunityIcons
          name={hasEntry ? "pencil" : "plus"}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {/* Content */}
      {hasEntry ? (
        <View style={styles.content}>
          {/* Period flow badge */}
          {flowInfo && (
            <View style={[styles.badge, { backgroundColor: flowInfo.color }]}>
              <Text style={styles.badgeText}>{flowInfo.label}</Text>
            </View>
          )}

          {/* Mood indicators */}
          {logData.mood_overall && (
            <View style={styles.row}>
              <Text style={styles.label}>Mood</Text>
              <Text style={styles.value}>
                {getMoodEmoji(logData.mood_overall)} {logData.mood_overall}/10
              </Text>
            </View>
          )}

          {/* Energy */}
          {logData.mood_energy && (
            <View style={styles.row}>
              <Text style={styles.label}>Energy</Text>
              <View style={styles.energyBar}>
                <View
                  style={[
                    styles.energyFill,
                    {
                      width: `${logData.mood_energy * 10}%`,
                      backgroundColor: colors.accent,
                    }
                  ]}
                />
              </View>
            </View>
          )}

          {/* Sleep */}
          {logData.sleep_hours && (
            <View style={styles.row}>
              <Text style={styles.label}>Sleep</Text>
              <Text style={styles.value}>
                {logData.sleep_hours}h
                {logData.sleep_quality && ` · ${['', 'Poor', 'Fair', 'OK', 'Good', 'Great'][logData.sleep_quality]}`}
              </Text>
            </View>
          )}

          {/* Symptoms */}
          {symptomNames.length > 0 && (
            <View style={styles.symptomsRow}>
              <Text style={styles.label}>Symptoms</Text>
              <View style={styles.symptomTags}>
                {symptomNames.map((name, index) => (
                  <View key={index} style={styles.symptomTag}>
                    <Text style={styles.symptomTagText}>{name}</Text>
                  </View>
                ))}
                {logData.symptoms.length > 3 && (
                  <Text style={styles.moreText}>+{logData.symptoms.length - 3} more</Text>
                )}
              </View>
            </View>
          )}

          {/* Notes preview */}
          {logData.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {logData.notes}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyContent}>
          {isPeriodDay && (
            <View style={[styles.badge, { backgroundColor: colors.calendarPeriod }]}>
              <Text style={styles.badgeText}>Period day</Text>
            </View>
          )}
          <Text style={styles.emptyText}>
            {isFuture ? 'Tap to add an entry' : 'No entry for this day'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isFuture ? 'Plan ahead by logging expected symptoms' : 'Tap to log your symptoms, mood, and more'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  energyBar: {
    width: 100,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  symptomsRow: {
    gap: spacing.xs,
  },
  symptomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  symptomTag: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  symptomTagText: {
    fontSize: 12,
    color: colors.text,
  },
  moreText: {
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

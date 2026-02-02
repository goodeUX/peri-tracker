import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Button, Chip, FAB } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors, spacing, borderRadius } from '../theme';
import { SYMPTOMS, SEVERITY_LABELS, PERIOD_FLOW_OPTIONS } from '../utils/constants';
import {
  getDailyLog,
  getRecentLogs,
  getCycleStats,
  getCurrentPeriod,
} from '../database/database';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [cycleStats, setCycleStats] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const [log, recent, stats, period] = await Promise.all([
        getDailyLog(today),
        getRecentLogs(7),
        getCycleStats(),
        getCurrentPeriod(),
      ]);

      setTodayLog(log);
      setRecentLogs(recent);
      setCycleStats(stats);
      setCurrentPeriod(period);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSymptomName = (symptomId) => {
    const symptom = SYMPTOMS.find((s) => s.id === symptomId);
    return symptom ? symptom.name : symptomId;
  };

  const getSeverityColor = (severity) => {
    return SEVERITY_LABELS[severity - 1]?.color || colors.surfaceVariant;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getDaysOnPeriod = () => {
    if (!currentPeriod) return null;
    const start = new Date(currentPeriod.start_date);
    const now = new Date();
    return Math.ceil((now - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Date Header */}
        <Text style={styles.dateHeader}>{formatDate(today)}</Text>

        {/* Period Status */}
        {currentPeriod && (
          <Surface style={styles.periodBanner} elevation={2}>
            <Icon name="water" size={24} color={colors.flowHeavy} />
            <View style={styles.periodInfo}>
              <Text style={styles.periodTitle}>Period Day {getDaysOnPeriod()}</Text>
              <Text style={styles.periodSubtitle}>
                Started {formatDate(currentPeriod.start_date)}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Calendar')}
              compact
            >
              Log
            </Button>
          </Surface>
        )}

        {/* Today's Summary */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Log</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Log')}
              compact
            >
              {todayLog ? 'Edit' : 'Add Entry'}
            </Button>
          </View>

          {todayLog ? (
            <View style={styles.todaySummary}>
              {/* Mood Summary */}
              {(todayLog.mood_overall || todayLog.mood_energy || todayLog.mood_anxiety) && (
                <View style={styles.moodRow}>
                  {todayLog.mood_overall && (
                    <View style={styles.moodItem}>
                      <Text style={styles.moodLabel}>Mood</Text>
                      <Text style={styles.moodValue}>{todayLog.mood_overall}/10</Text>
                    </View>
                  )}
                  {todayLog.mood_energy && (
                    <View style={styles.moodItem}>
                      <Text style={styles.moodLabel}>Energy</Text>
                      <Text style={styles.moodValue}>{todayLog.mood_energy}/10</Text>
                    </View>
                  )}
                  {todayLog.mood_anxiety && (
                    <View style={styles.moodItem}>
                      <Text style={styles.moodLabel}>Anxiety</Text>
                      <Text style={styles.moodValue}>{todayLog.mood_anxiety}/10</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Sleep Summary */}
              {todayLog.sleep_hours && (
                <View style={styles.sleepRow}>
                  <Icon name="sleep" size={18} color={colors.accent} />
                  <Text style={styles.sleepText}>
                    {todayLog.sleep_hours} hours of sleep
                    {todayLog.sleep_quality && ` (Quality: ${todayLog.sleep_quality}/5)`}
                  </Text>
                </View>
              )}

              {/* Symptoms */}
              {todayLog.symptoms && todayLog.symptoms.length > 0 && (
                <View style={styles.symptomsSection}>
                  <Text style={styles.sectionLabel}>Symptoms:</Text>
                  <View style={styles.symptomChips}>
                    {todayLog.symptoms.map((s) => (
                      <Chip
                        key={s.symptom_id}
                        style={[
                          styles.symptomChip,
                          { backgroundColor: getSeverityColor(s.severity) },
                        ]}
                        textStyle={styles.symptomChipText}
                        compact
                      >
                        {getSymptomName(s.symptom_id)}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              {/* Notes */}
              {todayLog.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.sectionLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{todayLog.notes}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="notebook-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No entry for today</Text>
              <Text style={styles.emptySubtext}>
                Tap "Add Entry" to log how you're feeling
              </Text>
            </View>
          )}
        </Surface>

        {/* Cycle Stats */}
        {cycleStats && cycleStats.averageCycleLength && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Cycle Insights</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cycleStats.averageCycleLength}</Text>
                <Text style={styles.statLabel}>Avg Cycle</Text>
                <Text style={styles.statUnit}>days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cycleStats.averagePeriodLength}</Text>
                <Text style={styles.statLabel}>Avg Period</Text>
                <Text style={styles.statUnit}>days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cycleStats.cycles.length}</Text>
                <Text style={styles.statLabel}>Cycles</Text>
                <Text style={styles.statUnit}>tracked</Text>
              </View>
            </View>
          </Surface>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Entries</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Insights')}
                compact
              >
                View All
              </Button>
            </View>

            {recentLogs.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.recentLogItem}>
                <Text style={styles.recentLogDate}>{formatDate(log.date)}</Text>
                <View style={styles.recentLogDetails}>
                  {log.symptoms && log.symptoms.length > 0 && (
                    <Text style={styles.recentLogSymptoms}>
                      {log.symptoms.length} symptom{log.symptoms.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                  {log.period_flow && log.period_flow !== 'none' && (
                    <Chip
                      compact
                      style={[
                        styles.flowChip,
                        {
                          backgroundColor: PERIOD_FLOW_OPTIONS.find(
                            (f) => f.value === log.period_flow
                          )?.color,
                        },
                      ]}
                      textStyle={styles.flowChipText}
                    >
                      {log.period_flow}
                    </Chip>
                  )}
                </View>
              </View>
            ))}
          </Surface>
        )}

        {/* Quick Tips */}
        <Surface style={styles.tipCard} elevation={1}>
          <Icon name="lightbulb-outline" size={24} color={colors.warning} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Tip</Text>
            <Text style={styles.tipText}>
              Consistent tracking helps identify patterns. Try to log at the same
              time each day for the most accurate insights.
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* FAB for quick log */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Log')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  dateHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  periodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.flowLight + '40',
    marginBottom: spacing.md,
  },
  periodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  periodSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  todaySummary: {
    gap: spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  moodItem: {
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moodValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sleepText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  symptomsSection: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  symptomChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  symptomChip: {
    marginBottom: 4,
  },
  symptomChipText: {
    fontSize: 12,
  },
  notesSection: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statUnit: {
    fontSize: 10,
    color: colors.textLight,
  },
  recentLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  recentLogDate: {
    fontSize: 14,
    color: colors.text,
  },
  recentLogDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recentLogSymptoms: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  flowChip: {
    height: 24,
  },
  flowChipText: {
    fontSize: 10,
    marginHorizontal: 4,
  },
  tipCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning + '15',
    marginBottom: spacing.md,
  },
  tipContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});

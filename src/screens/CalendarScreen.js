import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, Chip, Portal, Modal } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { getColors, spacing, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { PERIOD_FLOW_OPTIONS, SYMPTOMS } from '../utils/constants';
import {
  getLogsInRange,
  getPeriodsInRange,
  getDailyLog,
  endPeriod,
  getCurrentPeriod,
  getCycleStats,
} from '../database/database';

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDayLog, setSelectedDayLog] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [cycleStats, setCycleStats] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const styles = createStyles(colors);

  const loadCalendarData = async () => {
    try {
      // Get current month range
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const [logs, periods, period, stats] = await Promise.all([
        getLogsInRange(startDate, endDate),
        getPeriodsInRange(startDate, endDate),
        getCurrentPeriod(),
        getCycleStats(),
      ]);

      setCurrentPeriod(period);
      setCycleStats(stats);

      // Build marked dates object
      const marked = {};

      // Mark period days
      for (const p of periods) {
        const pStart = new Date(p.start_date);
        const pEnd = p.end_date ? new Date(p.end_date) : new Date();

        for (let d = new Date(pStart); d <= pEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          marked[dateStr] = {
            ...marked[dateStr],
            marked: true,
            dotColor: colors.flowHeavy,
            customStyles: {
              container: {
                backgroundColor: colors.flowLight + '60',
              },
            },
          };
        }
      }

      // Mark logged days
      for (const log of logs) {
        const hasSymptoms = log.symptoms && log.symptoms.length > 0;
        const hasMood = log.mood_overall || log.mood_energy || log.mood_anxiety;

        // Determine the color based on period flow
        let backgroundColor = null;
        if (log.period_flow && log.period_flow !== 'none') {
          const flowOption = PERIOD_FLOW_OPTIONS.find(
            (f) => f.value === log.period_flow
          );
          backgroundColor = flowOption?.color + '80';
        }

        marked[log.date] = {
          ...marked[log.date],
          marked: true,
          dotColor: hasSymptoms ? colors.primary : colors.accent,
          selected: log.date === selectedDate,
          selectedColor: colors.primary,
          customStyles: {
            container: {
              backgroundColor: backgroundColor || marked[log.date]?.customStyles?.container?.backgroundColor,
              borderRadius: 8,
            },
          },
        };
      }

      // Mark selected date
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };

      setMarkedDates(marked);

      // Load selected day log
      const dayLog = await getDailyLog(selectedDate);
      setSelectedDayLog(dayLog);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [selectedDate])
  );

  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
    const log = await getDailyLog(day.dateString);
    setSelectedDayLog(log);
  };

  const handleEndPeriod = async () => {
    if (currentPeriod) {
      try {
        await endPeriod(currentPeriod.id, selectedDate);
        await loadCalendarData();
        setModalVisible(false);
      } catch (error) {
        console.error('Error ending period:', error);
      }
    }
  };

  const getSymptomName = (symptomId) => {
    const symptom = SYMPTOMS.find((s) => s.id === symptomId);
    return symptom ? symptom.name : symptomId;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getPredictedPeriod = () => {
    if (!cycleStats || !cycleStats.cycles.length) return null;

    const lastPeriod = cycleStats.cycles[0];
    if (!lastPeriod) return null;

    const lastStart = new Date(lastPeriod.start_date);
    const avgCycleLength = cycleStats.averageCycleLength || 28;

    const nextPeriod = new Date(lastStart);
    nextPeriod.setDate(nextPeriod.getDate() + avgCycleLength);

    return nextPeriod;
  };

  const predictedPeriod = getPredictedPeriod();
  const daysUntilPeriod = predictedPeriod
    ? Math.ceil((predictedPeriod - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Period Prediction Banner */}
        {!currentPeriod && daysUntilPeriod !== null && daysUntilPeriod > 0 && (
          <Surface style={styles.predictionBanner} elevation={1}>
            <Icon name="calendar-clock" size={24} color={colors.primary} />
            <View style={styles.predictionInfo}>
              <Text style={styles.predictionTitle}>
                Next period in ~{daysUntilPeriod} days
              </Text>
              <Text style={styles.predictionSubtitle}>
                Based on your {cycleStats?.averageCycleLength || 28}-day cycle average
              </Text>
            </View>
          </Surface>
        )}

        {/* Current Period Banner */}
        {currentPeriod && (
          <Surface style={styles.periodActiveBanner} elevation={1}>
            <Icon name="water" size={24} color={colors.flowHeavy} />
            <View style={styles.periodInfo}>
              <Text style={styles.periodTitle}>Period in progress</Text>
              <Text style={styles.periodSubtitle}>
                Started {formatDate(currentPeriod.start_date)}
              </Text>
            </View>
            <Button mode="outlined" onPress={() => setModalVisible(true)} compact>
              End
            </Button>
          </Surface>
        )}

        {/* Calendar */}
        <Surface style={styles.calendarContainer} elevation={1}>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="custom"
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textLight,
              dotColor: colors.primary,
              selectedDotColor: '#FFFFFF',
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </Surface>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.flowMedium }]} />
            <Text style={styles.legendText}>Period</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Logged</Text>
          </View>
        </View>

        {/* Selected Day Details */}
        <Surface style={styles.dayDetails} elevation={1}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{formatDate(selectedDate)}</Text>
            {selectedDayLog && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Log', { date: selectedDate })}
                compact
              >
                Edit
              </Button>
            )}
          </View>

          {selectedDayLog ? (
            <View style={styles.dayContent}>
              {/* Period Flow */}
              {selectedDayLog.period_flow && selectedDayLog.period_flow !== 'none' && (
                <View style={styles.detailRow}>
                  <Icon name="water" size={18} color={colors.flowHeavy} />
                  <Text style={styles.detailText}>
                    Period: {selectedDayLog.period_flow}
                  </Text>
                </View>
              )}

              {/* Mood */}
              {selectedDayLog.mood_overall && (
                <View style={styles.detailRow}>
                  <Icon name="emoticon" size={18} color={colors.primary} />
                  <Text style={styles.detailText}>
                    Mood: {selectedDayLog.mood_overall}/10
                    {selectedDayLog.mood_energy && ` | Energy: ${selectedDayLog.mood_energy}/10`}
                    {selectedDayLog.mood_anxiety && ` | Anxiety: ${selectedDayLog.mood_anxiety}/10`}
                  </Text>
                </View>
              )}

              {/* Sleep */}
              {selectedDayLog.sleep_hours && (
                <View style={styles.detailRow}>
                  <Icon name="sleep" size={18} color={colors.accent} />
                  <Text style={styles.detailText}>
                    Sleep: {selectedDayLog.sleep_hours} hrs
                    {selectedDayLog.sleep_quality && ` (Quality: ${selectedDayLog.sleep_quality}/5)`}
                  </Text>
                </View>
              )}

              {/* Symptoms */}
              {selectedDayLog.symptoms && selectedDayLog.symptoms.length > 0 && (
                <View style={styles.symptomsSection}>
                  <Text style={styles.detailLabel}>Symptoms:</Text>
                  <View style={styles.symptomChips}>
                    {selectedDayLog.symptoms.map((s) => (
                      <Chip
                        key={s.symptom_id}
                        style={styles.symptomChip}
                        textStyle={styles.symptomChipText}
                        compact
                      >
                        {getSymptomName(s.symptom_id)} ({s.severity})
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              {/* Notes */}
              {selectedDayLog.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{selectedDayLog.notes}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyDay}>
              <Icon name="notebook-outline" size={32} color={colors.textLight} />
              <Text style={styles.emptyDayText}>No entry for this day</Text>
              {selectedDate <= new Date().toISOString().split('T')[0] && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Log', { date: selectedDate })}
                  style={styles.logButton}
                  icon="plus"
                >
                  Add Entry
                </Button>
              )}
              {selectedDate > new Date().toISOString().split('T')[0] && (
                <Text style={styles.emptyDaySubtext}>
                  You can log entries for today or past days
                </Text>
              )}
            </View>
          )}
        </Surface>

        {/* Cycle Stats */}
        {cycleStats && cycleStats.averageCycleLength && (
          <Surface style={styles.statsCard} elevation={1}>
            <Text style={styles.statsTitle}>Cycle Insights</Text>
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

      </ScrollView>

      {/* End Period Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>End Period?</Text>
          <Text style={styles.modalText}>
            Mark {formatDate(selectedDate)} as the last day of your period?
          </Text>
          <View style={styles.modalButtons}>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleEndPeriod}>
              End Period
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  predictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight + '30',
  },
  predictionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  predictionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  periodActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.flowLight + '40',
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
  calendarContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dayDetails: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayContent: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  symptomsSection: {
    marginTop: spacing.sm,
  },
  symptomChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  symptomChip: {
    backgroundColor: colors.surfaceVariant,
  },
  symptomChipText: {
    fontSize: 11,
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
  emptyDay: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyDayText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyDaySubtext: {
    fontSize: 12,
    color: colors.textLight,
  },
  logButton: {
    marginTop: spacing.md,
  },
  statsCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  modal: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});

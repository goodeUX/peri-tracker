import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { getColors, spacing, fonts } from '../theme';
import { useTheme } from '../context/ThemeContext';
import {
  getLogsInRange,
  getPeriodsInRange,
  getDailyLog,
} from '../database/database';
import CalendarWeekStrip from '../components/CalendarWeekStrip';

// Number of weeks to load in each direction
const WEEKS_TO_LOAD = 8;

export default function CalendarScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  const [calendarDays, setCalendarDays] = useState([]);
  const [periodDays, setPeriodDays] = useState(new Set());
  const [loggedDays, setLoggedDays] = useState(new Set());
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLogData, setSelectedLogData] = useState(null);
  const isLoadingRef = useRef(false);

  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  // Generate days for a date range
  const generateDays = (startDate, endDate) => {
    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push({
        date: new Date(currentDate),
        dateString: currentDate.toISOString().split('T')[0],
        day: currentDate.getDate(),
        isToday: currentDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  // Get the Monday of the week containing the given date
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Load initial calendar data centered around today
  const loadInitialData = async () => {
    try {
      const today = new Date();
      const monday = getMonday(today);

      // Start 4 weeks before current week, end 4 weeks after
      const startDate = new Date(monday);
      startDate.setDate(startDate.getDate() - (WEEKS_TO_LOAD * 7));

      const endDate = new Date(monday);
      endDate.setDate(endDate.getDate() + (WEEKS_TO_LOAD * 7) - 1);

      const days = generateDays(startDate, endDate);
      setCalendarDays(days);
      setDateRange({ start: startDate, end: endDate });

      // Reset and reload period/logged data for accurate styling
      await loadDataForRange(startDate, endDate, true);
    } catch (error) {
      console.error('Error loading initial calendar data:', error);
    }
  };

  // Load log and period data for a date range
  // When reset is true, start with empty sets (for refresh); otherwise append to existing data (for infinite scroll)
  const loadDataForRange = async (startDate, endDate, reset = false) => {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const [logs, periods] = await Promise.all([
      getLogsInRange(startStr, endStr),
      getPeriodsInRange(startStr, endStr),
    ]);

    // Build period days set
    const periodSet = reset ? new Set() : new Set(periodDays);
    for (const p of periods) {
      const pStart = new Date(p.start_date);
      const pEnd = p.end_date ? new Date(p.end_date) : new Date();
      for (let d = new Date(pStart); d <= pEnd; d.setDate(d.getDate() + 1)) {
        periodSet.add(d.toISOString().split('T')[0]);
      }
    }
    for (const log of logs) {
      if (log.period_flow && log.period_flow !== 'none') {
        periodSet.add(log.date);
      }
    }
    setPeriodDays(periodSet);

    // Build logged days set
    const loggedSet = reset ? new Set() : new Set(loggedDays);
    for (const log of logs) {
      loggedSet.add(log.date);
    }
    setLoggedDays(loggedSet);
  };

  // Load previous weeks
  const loadPreviousWeeks = useCallback(async () => {
    if (isLoadingRef.current || !dateRange.start) return;
    isLoadingRef.current = true;

    try {
      const newStart = new Date(dateRange.start);
      newStart.setDate(newStart.getDate() - (WEEKS_TO_LOAD * 7));

      const newEnd = new Date(dateRange.start);
      newEnd.setDate(newEnd.getDate() - 1);

      const newDays = generateDays(newStart, newEnd);
      setCalendarDays(prev => [...newDays, ...prev]);
      setDateRange(prev => ({ ...prev, start: newStart }));

      await loadDataForRange(newStart, newEnd);
    } catch (error) {
      console.error('Error loading previous weeks:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [dateRange.start]);

  // Load next weeks
  const loadNextWeeks = useCallback(async () => {
    if (isLoadingRef.current || !dateRange.end) return;
    isLoadingRef.current = true;

    try {
      const newStart = new Date(dateRange.end);
      newStart.setDate(newStart.getDate() + 1);

      const newEnd = new Date(dateRange.end);
      newEnd.setDate(newEnd.getDate() + (WEEKS_TO_LOAD * 7));

      const newDays = generateDays(newStart, newEnd);
      setCalendarDays(prev => [...prev, ...newDays]);
      setDateRange(prev => ({ ...prev, end: newEnd }));

      await loadDataForRange(newStart, newEnd);
    } catch (error) {
      console.error('Error loading next weeks:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [dateRange.end]);

  // Load log data for selected date
  const loadSelectedDateLog = useCallback(async (dateString) => {
    try {
      const log = await getDailyLog(dateString);
      setSelectedLogData(log);
    } catch (error) {
      console.error('Error loading log for selected date:', error);
      setSelectedLogData(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      loadSelectedDateLog(selectedDate);
    }, [selectedDate, loadSelectedDateLog])
  );

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    loadSelectedDateLog(day.dateString);
  };

  const handleCardPress = () => navigation.navigate('Log', { date: selectedDate });

  const changeMonth = (delta) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setMonth(d.getMonth() + delta);
    const next = d.toISOString().split('T')[0];
    setSelectedDate(next);
    loadSelectedDateLog(next);
  };

  const periodLabel = useMemo(() => {
    const flow = selectedLogData?.period_flow;
    if (flow && flow !== 'none') {
      return flow.charAt(0).toUpperCase() + flow.slice(1);
    }
    return periodDays.has(selectedDate) ? 'Period' : 'None';
  }, [selectedLogData, periodDays, selectedDate]);

  const sleepHoursLabel = useMemo(() => {
    const h = selectedLogData?.sleep_hours;
    if (h === null || h === undefined) return '—';
    const rounded = Math.round(h * 10) / 10;
    return `${rounded}hrs`;
  }, [selectedLogData]);

  const sleepQuality10 = useMemo(() => {
    const q = selectedLogData?.sleep_quality;
    if (!q) return '—';
    return String(Math.min(10, Math.max(0, q * 2)));
  }, [selectedLogData]);

  return (
    <LinearGradient
      colors={['#F6E9F6', '#E8E4FF']}
      start={{ x: 0.15, y: 0.05 }}
      end={{ x: 0.85, y: 0.95 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, Samantha</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cog" size={20} color="#201F2D" />
          </TouchableOpacity>
        </View>

        <CalendarWeekStrip
          selectedDateString={selectedDate}
          periodDays={periodDays}
          loggedDays={loggedDays}
          onSelectDateString={(ds) => {
            setSelectedDate(ds);
            loadSelectedDateLog(ds);
          }}
          onChangeMonth={changeMonth}
          textColor="#201F2D"
        />

        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.flex1} onPress={handleCardPress} activeOpacity={0.85}>
            <BlurView intensity={18} tint="light" style={styles.smallCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="water" size={18} color="#F75E77" />
              </View>
              <Text style={styles.smallCardText}>
                <Text style={styles.smallCardLabel}>Period:</Text> {periodLabel}
              </Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.flex1} onPress={handleCardPress} activeOpacity={0.85}>
            <BlurView intensity={18} tint="light" style={styles.smallCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={18} color="#4FA4A5" />
              </View>
              <Text style={styles.smallCardText}>Sleep: {sleepHoursLabel}</Text>
              <Text style={styles.smallCardText}>Quality: {sleepQuality10}/10</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleCardPress} activeOpacity={0.85}>
          <BlurView intensity={18} tint="light" style={styles.largeCard}>
            <View style={styles.largeCardHeader}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color="#4FA4A5" />
              </View>
              <View style={styles.largeCardLines}>
                <Text style={styles.largeCardText}>
                  Mood: {selectedLogData?.mood_overall ?? '—'}/10
                </Text>
                <Text style={styles.largeCardText}>
                  Energy: {selectedLogData?.mood_energy ?? '—'}/10
                </Text>
                <Text style={styles.largeCardText}>
                  Anxiety: {selectedLogData?.mood_anxiety ?? '—'}/10
                </Text>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const createStyles = (colors, insets) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: (insets?.top ?? 0) + spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  greeting: {
    fontFamily: fonts.title,
    fontSize: 36,
    letterSpacing: -1.5,
    color: '#201F2D',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: spacing.lg,
  },
  flex1: {
    flex: 1,
  },
  smallCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(222, 221, 227, 0.18)',
    overflow: 'hidden',
    minHeight: 76,
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  smallCardText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#201F2D',
  },
  smallCardLabel: {
    fontFamily: 'NotoSans_500Medium',
    color: '#201F2D',
  },
  largeCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(222, 221, 227, 0.18)',
    overflow: 'hidden',
  },
  largeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  largeCardLines: {
    flex: 1,
    gap: 6,
  },
  largeCardText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 18,
    color: '#201F2D',
  },
});

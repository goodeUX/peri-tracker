import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { getColors, fonts } from '../theme';
import { useTheme } from '../context/ThemeContext';
import {
  getLogsInRange,
  getPeriodsInRange,
  getDailyLog,
} from '../database/database';
import JournalHeader from '../components/JournalHeader';

// Import SVG icons
import WaterDropIcon from '../../assets/icons/water_drop.svg';
import BedtimeIcon from '../../assets/icons/bedtime.svg';
import MoodIcon from '../../assets/icons/mood.svg';

// Number of weeks to load in each direction
const WEEKS_TO_LOAD = 8;

// Design colors from Figma
const COLORS = {
  heavy: '#201F2D',
  cardBg: 'rgba(255, 255, 255, 0.4)',
};

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  const [calendarDays, setCalendarDays] = useState([]);
  const [periodDays, setPeriodDays] = useState(new Set());
  const [loggedDays, setLoggedDays] = useState(new Set());
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLogData, setSelectedLogData] = useState(null);
  const isLoadingRef = useRef(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const changeWeek = (delta) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + (delta * 7));
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
    <View style={styles.container}>
      {/* Background gradient matching Figma */}
      <LinearGradient
        colors={[
          'rgba(233, 216, 243, 0.48)',
          'rgba(255, 255, 255, 0.47)',
          'rgba(169, 153, 227, 0.5)',
        ]}
        locations={[0, 0.486, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Pink radial accent - top right */}
      <View style={styles.pinkAccent} />

      {/* Peach radial accent - bottom left */}
      <View style={styles.peachAccent} />

      <JournalHeader
        selectedDateString={selectedDate}
        periodDays={periodDays}
        loggedDays={loggedDays}
        onSelectDateString={(ds) => {
          setSelectedDate(ds);
          loadSelectedDateLog(ds);
        }}
        onChangeWeek={changeWeek}
      />

      {/* Cards section */}
      <View style={styles.cardsSection}>
        <View style={styles.cardsRow}>
          {/* Period Card */}
          <TouchableOpacity style={styles.flex1} onPress={handleCardPress} activeOpacity={0.85}>
            <BlurView intensity={12} tint="light" style={styles.smallCard}>
              <WaterDropIcon width={40} height={40} />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardText}>
                  <Text style={styles.cardLabel}>Period: </Text>
                  <Text style={styles.cardValue}>{periodLabel}</Text>
                </Text>
              </View>
            </BlurView>
          </TouchableOpacity>

          {/* Sleep Card */}
          <TouchableOpacity style={styles.flex1} onPress={handleCardPress} activeOpacity={0.85}>
            <BlurView intensity={12} tint="light" style={styles.smallCard}>
              <BedtimeIcon width={40} height={40} />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardText}>Sleep: {sleepHoursLabel}</Text>
                <Text style={styles.cardText}>Quality: {sleepQuality10}/10</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Mood Card */}
        <TouchableOpacity onPress={handleCardPress} activeOpacity={0.85}>
          <BlurView intensity={12} tint="light" style={styles.largeCard}>
            <MoodIcon width={40} height={40} />
            <View style={styles.largeCardLines}>
              <Text style={styles.cardText}>
                Mood: {selectedLogData?.mood_overall ?? '—'}/10
              </Text>
              <Text style={styles.cardText}>
                Energy: {selectedLogData?.mood_energy ?? '—'}/10
              </Text>
              <Text style={styles.cardText}>
                Anxiety: {selectedLogData?.mood_anxiety ?? '—'}/10
              </Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pinkAccent: {
    position: 'absolute',
    top: 200,
    right: -100,
    width: 350,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(248, 207, 248, 0.4)',
    transform: [{ scaleX: 1.2 }],
  },
  peachAccent: {
    position: 'absolute',
    top: 150,
    left: -150,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(248, 216, 201, 0.35)',
    transform: [{ scaleX: 1.1 }],
  },
  cardsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  flex1: {
    flex: 1,
  },
  smallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
    height: 88,
    gap: 8,
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardText: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: COLORS.heavy,
    lineHeight: 24,
  },
  cardLabel: {
    fontFamily: fonts.semiBold,
    color: COLORS.heavy,
  },
  cardValue: {
    fontFamily: fonts.regular,
    color: COLORS.heavy,
  },
  largeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
    gap: 8,
  },
  largeCardLines: {
    flex: 1,
  },
});

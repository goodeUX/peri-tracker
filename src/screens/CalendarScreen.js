import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, PanResponder, Animated } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getColors, spacing, fonts } from '../theme';
import { useTheme } from '../context/ThemeContext';
import {
  getLogsInRange,
  getPeriodsInRange,
} from '../database/database';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [periodDays, setPeriodDays] = useState(new Set());
  const [loggedDays, setLoggedDays] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          // Swipe right - previous month
          Animated.timing(translateX, {
            toValue: 300,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            goToPreviousMonth();
            translateX.setValue(0);
          });
        } else if (gestureState.dx < -50) {
          // Swipe left - next month
          Animated.timing(translateX, {
            toValue: -300,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            goToNextMonth();
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const styles = createStyles(colors, insets);

  const loadCalendarData = async () => {
    try {
      // Get the calendar grid for current month view
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // First day of month
      const firstDay = new Date(year, month, 1);
      // Last day of month
      const lastDay = new Date(year, month + 1, 0);

      // Adjust to start from Monday
      let startDay = new Date(firstDay);
      const dayOfWeek = firstDay.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDay.setDate(firstDay.getDate() - daysToSubtract);

      // Build 5 weeks of days
      const days = [];
      const currentDate = new Date(startDay);
      for (let i = 0; i < 35; i++) {
        days.push({
          date: new Date(currentDate),
          dateString: currentDate.toISOString().split('T')[0],
          day: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: currentDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
          showMonth: currentDate.getDate() === 1 && currentDate.getMonth() !== month,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setCalendarDays(days);

      // Get data range
      const startStr = days[0].dateString;
      const endStr = days[days.length - 1].dateString;

      const [logs, periods] = await Promise.all([
        getLogsInRange(startStr, endStr),
        getPeriodsInRange(startStr, endStr),
      ]);

      // Build period days set
      const periodSet = new Set();
      for (const p of periods) {
        const pStart = new Date(p.start_date);
        const pEnd = p.end_date ? new Date(p.end_date) : new Date();
        for (let d = new Date(pStart); d <= pEnd; d.setDate(d.getDate() + 1)) {
          periodSet.add(d.toISOString().split('T')[0]);
        }
      }
      setPeriodDays(periodSet);

      // Build logged days set
      const loggedSet = new Set();
      for (const log of logs) {
        loggedSet.add(log.date);
      }
      setLoggedDays(loggedSet);

    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [currentMonth])
  );

  const handleDayPress = async (day) => {
    if (!day.isCurrentMonth) return;
    setSelectedDate(day.dateString);
    navigation.navigate('Log', { date: day.dateString });
  };

  const getDayStyle = (day) => {
    const isPeriod = periodDays.has(day.dateString);
    const isLogged = loggedDays.has(day.dateString);
    const isSelected = day.dateString === selectedDate;

    if (!day.isCurrentMonth) {
      return {
        backgroundColor: 'transparent',
        textColor: colors.textLight,
      };
    }

    if (isSelected) {
      return {
        backgroundColor: 'transparent',
        textColor: colors.text,
        borderColor: colors.calendarSelected,
        borderWidth: 2,
      };
    }

    if (isPeriod) {
      return {
        backgroundColor: colors.calendarPeriod,
        textColor: colors.text,
      };
    }

    if (isLogged) {
      return {
        backgroundColor: colors.calendarLogged,
        textColor: colors.text,
      };
    }

    return {
      backgroundColor: colors.calendarEmpty,
      textColor: colors.text,
    };
  };

  const getMonthLabel = (day) => {
    if (!day.showMonth) return null;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[day.date.getMonth()];
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Journal</Text>

      {/* Day of week headers */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day, index) => (
          <View key={index} style={styles.weekDayContainer}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid with swipe */}
      <Animated.View
        style={[styles.calendarGrid, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {calendarDays.map((day, index) => {
          const dayStyle = getDayStyle(day);
          const monthLabel = getMonthLabel(day);

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayContainer}
              onPress={() => handleDayPress(day)}
              activeOpacity={day.isCurrentMonth ? 0.7 : 1}
            >
              <View
                style={[
                  styles.dayCircle,
                  { backgroundColor: dayStyle.backgroundColor },
                  dayStyle.borderWidth && {
                    borderWidth: dayStyle.borderWidth,
                    borderColor: dayStyle.borderColor,
                  },
                ]}
              >
                {monthLabel && (
                  <Text style={styles.monthLabel}>{monthLabel}</Text>
                )}
                <Text
                  style={[
                    styles.dayText,
                    { color: dayStyle.textColor },
                    !day.isCurrentMonth && styles.fadedText,
                  ]}
                >
                  {day.day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}

const createStyles = (colors, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets.top + spacing.md,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: fonts.title,
    fontSize: 32,
    color: colors.text,
    marginBottom: spacing.lg,
    marginLeft: spacing.sm,
    letterSpacing: -0.5,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 120,
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayCircle: {
    flex: 1,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  fadedText: {
    opacity: 0.4,
  },
  monthLabel: {
    fontSize: 8,
    color: colors.textLight,
    fontWeight: '600',
    position: 'absolute',
    top: 6,
  },
});

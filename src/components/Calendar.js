import React, { useRef, useCallback, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { spacing } from '../theme';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const VISIBLE_ROWS = 5;

const Calendar = forwardRef(function Calendar({
  calendarDays,
  periodDays,
  loggedDays,
  selectedDate,
  onDayPress,
  onLoadPrevious,
  onLoadNext,
  colors,
}, ref) {
  const scrollViewRef = useRef(null);
  const todayString = new Date().toISOString().split('T')[0];
  const [rowHeight, setRowHeight] = useState(0);
  const hasScrolledToToday = useRef(false);

  // Calculate row height when container layout changes
  const handleContainerLayout = useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    // Each day is 1/7 of width with aspect ratio 1
    setRowHeight(width / 7);
  }, []);

  // Find today's row index
  const getTodayRowIndex = useCallback(() => {
    const todayIndex = calendarDays.findIndex(day => day.dateString === todayString);
    if (todayIndex === -1) return 0;
    return Math.floor(todayIndex / 7);
  }, [calendarDays, todayString]);

  // Scroll to today's date (position today on the bottom row)
  const scrollToToday = useCallback((animated = true) => {
    if (!scrollViewRef.current || rowHeight === 0) return;
    const todayRow = getTodayRowIndex();
    // Position today's row at the bottom of the 5 visible rows
    const targetRow = Math.max(0, todayRow - (VISIBLE_ROWS - 1));
    scrollViewRef.current.scrollTo({ y: targetRow * rowHeight, animated });
  }, [rowHeight, getTodayRowIndex]);

  // Scroll to today on initial load (without animation)
  useEffect(() => {
    if (rowHeight > 0 && calendarDays.length > 0 && !hasScrolledToToday.current) {
      // Small delay to ensure ScrollView is ready
      setTimeout(() => {
        scrollToToday(false);
        hasScrolledToToday.current = true;
      }, 100);
    }
  }, [rowHeight, calendarDays.length, scrollToToday]);

  // Expose scrollToToday to parent via ref
  useImperativeHandle(ref, () => ({
    scrollToToday,
  }), [scrollToToday]);

  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    // Load previous dates when scrolling near the top
    if (contentOffset.y < 100) {
      onLoadPrevious?.();
    }

    // Load future dates when scrolling near the bottom
    if (contentOffset.y + layoutMeasurement.height > contentSize.height - 100) {
      onLoadNext?.();
    }
  }, [onLoadPrevious, onLoadNext]);

  const getDayStyle = (day) => {
    const isPeriod = periodDays.has(day.dateString);
    const isLogged = loggedDays.has(day.dateString);
    const isToday = day.dateString === todayString;
    const isFuture = day.dateString > todayString;
    const isSelected = day.dateString === selectedDate;

    // Base style determined by day type
    let style = {};

    // Today's date
    if (isToday) {
      if (isPeriod) {
        style = {
          backgroundColor: colors.calendarPeriod,
          textColor: colors.text,
        };
      } else if (isLogged) {
        style = {
          backgroundColor: colors.calendarTodayFilled,
          textColor: colors.text,
        };
      } else {
        style = {
          backgroundColor: colors.calendarFuture,
          textColor: colors.text,
          borderColor: colors.calendarToday,
          borderWidth: 2,
        };
      }
    }
    // Future dates
    else if (isFuture) {
      style = {
        backgroundColor: colors.calendarFuture,
        textColor: colors.textLight,
        borderColor: colors.calendarFutureBorder,
        borderWidth: 1,
      };
    }
    // Past dates with period
    else if (isPeriod) {
      style = {
        backgroundColor: colors.calendarPeriod,
        textColor: colors.text,
      };
    }
    // Past dates with entry (no period)
    else if (isLogged) {
      style = {
        backgroundColor: colors.calendarLogged,
        textColor: colors.text,
      };
    }
    // Past dates without entry
    else {
      style = {
        backgroundColor: colors.calendarEmpty,
        textColor: colors.text,
      };
    }

    // Add selection indicator
    if (isSelected) {
      style.borderColor = colors.calendarToday;
      style.borderWidth = 2;
    }

    return style;
  };

  // Check if there's a period day link (consecutive period days)
  const getPeriodLink = (day, index) => {
    const isPeriod = periodDays.has(day.dateString);
    if (!isPeriod) return { left: false, right: false };

    // Check previous day (left link)
    const prevDay = calendarDays[index - 1];
    const hasLeftLink = prevDay &&
      periodDays.has(prevDay.dateString) &&
      index % 7 !== 0; // Not first day of row

    // Check next day (right link)
    const nextDay = calendarDays[index + 1];
    const hasRightLink = nextDay &&
      periodDays.has(nextDay.dateString) &&
      (index + 1) % 7 !== 0; // Not last day of row

    return { left: hasLeftLink, right: hasRightLink };
  };

  const getMonthLabel = (day) => {
    // Show month label on the 1st of each month
    if (day.day !== 1) return null;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[day.date.getMonth()];
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {/* Day of week headers */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day, index) => (
          <View key={index} style={styles.weekDayContainer}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable calendar grid */}
      {rowHeight > 0 && (
        <View style={{ height: rowHeight * VISIBLE_ROWS, overflow: 'hidden' }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.calendarGrid}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            snapToInterval={rowHeight}
            decelerationRate="fast"
          >
        {calendarDays.map((day, index) => {
          const dayStyle = getDayStyle(day);
          const monthLabel = getMonthLabel(day);
          const periodLink = getPeriodLink(day, index);

          return (
            <TouchableOpacity
              key={day.dateString}
              style={styles.dayContainer}
              onPress={() => onDayPress?.(day)}
              activeOpacity={0.7}
            >
              {/* Period link connectors */}
              {periodLink.left && (
                <View style={[styles.periodLinkLeft, { backgroundColor: colors.calendarPeriodLink }]} />
              )}
              {periodLink.right && (
                <View style={[styles.periodLinkRight, { backgroundColor: colors.calendarPeriodLink }]} />
              )}
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
                  ]}
                >
                  {day.day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        </ScrollView>
        </View>
      )}
    </View>
  );
});

export default Calendar;

const createStyles = (colors) => StyleSheet.create({
  container: {
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
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
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },
  dayCircle: {
    flex: 1,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  monthLabel: {
    fontSize: 8,
    color: colors.textLight,
    fontWeight: '600',
    position: 'absolute',
    top: 6,
  },
  periodLinkLeft: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: '50%',
    zIndex: 0,
  },
  periodLinkRight: {
    position: 'absolute',
    right: 0,
    top: 4,
    bottom: 4,
    width: '50%',
    zIndex: 0,
  },
});

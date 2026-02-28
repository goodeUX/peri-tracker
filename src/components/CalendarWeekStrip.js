import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { fonts } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Import SVG icons
import ChevronLeft from '../../assets/icons/chevron_left.svg';
import ChevronRight from '../../assets/icons/chevron_right.svg';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Design colors from Figma
const COLORS = {
  heavy: '#201F2D',
  periodCircle: 'rgba(251, 121, 142, 0.4)',
  entryCircle: 'rgba(111, 108, 198, 0.4)',
  noEntryCircle: 'rgba(32, 31, 45, 0.05)',
  futureCircle: 'rgba(32, 31, 45, 0.05)',
  periodLink: 'rgba(254, 154, 170, 0.2)',
};

function toDateString(date) {
  return date.toISOString().split('T')[0];
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function CalendarWeekStrip({
  selectedDateString,
  periodDays,
  loggedDays,
  onSelectDateString,
  onChangeWeek,
  textColor = '#201F2D',
}) {
  const selectedDate = useMemo(
    () => new Date(selectedDateString + 'T00:00:00'),
    [selectedDateString]
  );

  // Animation for week changes
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevWeekStart = useRef(null);

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);

  // Animate when week changes
  useEffect(() => {
    const currentWeekStr = toDateString(weekStart);
    const prevWeekStr = prevWeekStart.current ? toDateString(prevWeekStart.current) : null;

    if (prevWeekStr && currentWeekStr !== prevWeekStr) {
      const direction = weekStart > prevWeekStart.current ? 1 : -1;

      // Snap to off-screen, then spring in
      slideAnim.setValue(direction * SCREEN_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 11,
      }).start();
    }

    prevWeekStart.current = weekStart;
  }, [weekStart]);

  const monthLabel = useMemo(() => {
    const month = selectedDate
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase();
    const year = selectedDate.getFullYear();
    return { month, year: String(year) };
  }, [selectedDate]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const styles = useMemo(() => createStyles(textColor), [textColor]);

  // Find consecutive period days for the linking background
  const periodRanges = useMemo(() => {
    const ranges = [];
    let rangeStart = null;

    weekDays.forEach((d, idx) => {
      const ds = toDateString(d);
      const isPeriod = periodDays?.has?.(ds);

      if (isPeriod && rangeStart === null) {
        rangeStart = idx;
      } else if (!isPeriod && rangeStart !== null) {
        ranges.push({ start: rangeStart, end: idx - 1 });
        rangeStart = null;
      }
    });

    if (rangeStart !== null) {
      ranges.push({ start: rangeStart, end: 6 });
    }

    return ranges;
  }, [weekDays, periodDays]);

  const getCircleStyle = (dateString, isSelected) => {
    const isPeriod = periodDays?.has?.(dateString);
    const isLogged = loggedDays?.has?.(dateString);
    const today = new Date().toISOString().split('T')[0];
    const isFuture = dateString > today;

    let bg = COLORS.noEntryCircle;
    let opacity = 1;

    if (isFuture) {
      bg = COLORS.futureCircle;
      opacity = 0.5;
    } else if (isPeriod) {
      bg = COLORS.periodCircle;
    } else if (isLogged) {
      bg = COLORS.entryCircle;
    }

    return [
      styles.dayCircle,
      { backgroundColor: bg, opacity },
      isSelected && styles.dayCircleSelected,
    ];
  };

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.monthRow}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => onChangeWeek?.(-1)}
          activeOpacity={0.7}
        >
          <ChevronLeft width={48} height={48} />
        </TouchableOpacity>

        <View style={styles.monthLabel}>
          <Text style={styles.monthText}>{monthLabel.month} </Text>
          <Text style={styles.yearText}>{monthLabel.year}</Text>
        </View>

        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => onChangeWeek?.(1)}
          activeOpacity={0.7}
        >
          <ChevronRight width={48} height={48} />
        </TouchableOpacity>
      </View>

      {/* Day of week headers — fixed */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((d, idx) => (
          <View key={`${d}-${idx}`} style={styles.weekHeaderCell}>
            <Text style={styles.weekHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Week row with dates — slides on week change */}
      <Animated.View style={[styles.weekRow, { transform: [{ translateX: slideAnim }] }]}>
          {/* Period linking backgrounds */}
          {periodRanges.map((range, idx) => (
            <View
              key={`range-${idx}`}
              style={[
                styles.periodLinkBg,
                {
                  left: `${(range.start / 7) * 100}%`,
                  width: `${((range.end - range.start + 1) / 7) * 100}%`,
                },
              ]}
            />
          ))}

          {weekDays.map((d) => {
            const ds = toDateString(d);
            const isSelected = ds === selectedDateString;
            const today = new Date().toISOString().split('T')[0];
            const isFuture = ds > today;
            const isPeriod = periodDays?.has?.(ds);
            const isEntry = loggedDays?.has?.(ds) && !isPeriod && !isFuture;

            const circleStyle = getCircleStyle(ds, isSelected);
            const dateText = (
              <Text style={[styles.dayText, isFuture && styles.dayTextFuture]}>
                {d.getDate()}
              </Text>
            );

            return (
              <TouchableOpacity
                key={ds}
                style={styles.dayCell}
                onPress={() => onSelectDateString?.(ds)}
                activeOpacity={0.85}
              >
                {isEntry ? (
                  <BlurView intensity={12} tint="light" style={circleStyle}>
                    {dateText}
                  </BlurView>
                ) : (
                  <View style={circleStyle}>
                    {dateText}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
      </Animated.View>
    </View>
  );
}


const createStyles = (textColor) =>
  StyleSheet.create({
    container: {
      gap: 12,
      overflow: 'hidden',
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    monthArrow: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthLabel: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    monthText: {
      fontFamily: fonts.semiBold,
      fontSize: 20,
      color: textColor,
    },
    yearText: {
      fontFamily: fonts.regular,
      fontSize: 20,
      color: textColor,
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    weekHeaderCell: {
      width: 48,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekHeaderText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: textColor,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      position: 'relative',
    },
    periodLinkBg: {
      position: 'absolute',
      height: 48,
      backgroundColor: COLORS.periodLink,
      borderRadius: 24,
      top: 0,
    },
    dayCell: {
      width: 48,
      alignItems: 'center',
    },
    dayCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    dayCircleSelected: {
      borderWidth: 2,
      borderColor: 'rgba(32, 31, 45, 0.6)',
    },
    dayText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      color: textColor,
    },
    dayTextFuture: {
      opacity: 0.5,
    },
  });

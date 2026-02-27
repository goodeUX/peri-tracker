import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../theme';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
  onChangeMonth,
  textColor = '#201F2D',
}) {
  const selectedDate = useMemo(
    () => new Date(selectedDateString + 'T00:00:00'),
    [selectedDateString]
  );

  const monthLabel = useMemo(() => {
    const month = selectedDate
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase();
    const year = selectedDate.getFullYear();
    return { month, year: String(year) };
  }, [selectedDate]);

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const styles = useMemo(() => createStyles(textColor), [textColor]);

  const getCircleStyle = (dateString, isSelected) => {
    const isPeriod = periodDays?.has?.(dateString);
    const isLogged = loggedDays?.has?.(dateString);

    let bg = 'rgba(255, 255, 255, 0.55)';
    if (isPeriod) bg = 'rgba(247, 94, 119, 0.35)';
    else if (isLogged) bg = 'rgba(79, 164, 165, 0.28)';

    return [
      styles.dayCircle,
      { backgroundColor: bg },
      isSelected && styles.dayCircleSelected,
    ];
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => onChangeMonth?.(-1)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={textColor} />
        </TouchableOpacity>

        <View style={styles.monthLabel}>
          <Text style={styles.monthText}>{monthLabel.month}</Text>
          <Text style={styles.yearText}> {monthLabel.year}</Text>
        </View>

        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => onChangeMonth?.(1)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="chevron-right" size={26} color={textColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((d, idx) => (
          <View key={`${d}-${idx}`} style={styles.weekHeaderCell}>
            <Text style={styles.weekHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((d) => {
          const ds = toDateString(d);
          const isSelected = ds === selectedDateString;
          return (
            <TouchableOpacity
              key={ds}
              style={styles.dayCell}
              onPress={() => onSelectDateString?.(ds)}
              activeOpacity={0.85}
            >
              <View style={getCircleStyle(ds, isSelected)}>
                <Text style={styles.dayText}>{d.getDate()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (textColor) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.md,
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      gap: 14,
    },
    monthArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    monthLabel: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      minWidth: 120,
    },
    monthText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 16,
      letterSpacing: 0.5,
      color: textColor,
    },
    yearText: {
      fontFamily: 'NotoSans_400Regular',
      fontSize: 16,
      color: textColor,
      opacity: 0.8,
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    weekHeaderCell: {
      flex: 1,
      alignItems: 'center',
    },
    weekHeaderText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 12,
      color: textColor,
      opacity: 0.75,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    dayCell: {
      flex: 1,
      alignItems: 'center',
    },
    dayCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleSelected: {
      borderWidth: 1.5,
      borderColor: 'rgba(32, 31, 45, 0.55)',
    },
    dayText: {
      fontFamily: 'NotoSans_500Medium',
      fontSize: 14,
      color: textColor,
    },
  });


import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../theme';
import CalendarWeekStrip from './CalendarWeekStrip';
import SettingsIcon from '../../assets/icons/settings.svg';

const COLORS = {
  heavy: '#201F2D',
  headerBg: 'rgba(255, 255, 255, 0.8)',
};

export default function JournalHeader({
  selectedDateString,
  periodDays,
  loggedDays,
  onSelectDateString,
  onChangeWeek,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets), [insets]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, Samantha</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <SettingsIcon width={40} height={40} />
        </TouchableOpacity>
      </View>

      <CalendarWeekStrip
        selectedDateString={selectedDateString}
        periodDays={periodDays}
        loggedDays={loggedDays}
        onSelectDateString={onSelectDateString}
        onChangeWeek={onChangeWeek}
        textColor={COLORS.heavy}
      />
    </View>
  );
}

const createStyles = (insets) => StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.headerBg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: (insets?.top ?? 0) + 12,
    marginBottom: 24,
  },
  greeting: {
    fontFamily: fonts.title,
    fontSize: 32,
    letterSpacing: -0.64,
    color: COLORS.heavy,
  },
  settingsButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

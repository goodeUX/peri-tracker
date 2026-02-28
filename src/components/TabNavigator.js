import React, { useRef, useState } from 'react';
import { View } from 'react-native';

import { getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import CalendarScreen from '../screens/CalendarScreen';
import InsightsScreen from '../screens/InsightsScreen';
import CustomTabBar from './CustomTabBar';
import TabPager from './TabPager';

export const TABS = [
  { name: 'Journal', icon: 'calendar', component: CalendarScreen },
  { name: 'Insights', icon: 'chart', component: InsightsScreen },
];

export default function TabNavigator({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const pagerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onTabPress = (index) => {
    pagerRef.current?.setPage(index);
    setCurrentIndex(index);
  };

  const onFabPress = () => {
    const today = new Date().toISOString().split('T')[0];
    navigation.navigate('Log', { date: today });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TabPager
        ref={pagerRef}
        tabs={TABS}
        initialIndex={0}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        navigation={navigation}
      />
      <CustomTabBar
        tabs={TABS}
        currentIndex={currentIndex}
        onTabPress={onTabPress}
        onFabPress={onFabPress}
      />
    </View>
  );
}

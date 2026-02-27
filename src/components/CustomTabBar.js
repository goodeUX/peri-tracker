import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Material Symbols icons (weight 400)
import CalendarOutline from '@material-symbols/svg-400/outlined/calendar_month.svg';
import CalendarFilled from '@material-symbols/svg-400/outlined/calendar_month-fill.svg';
import ChartOutline from '@material-symbols/svg-400/outlined/bar_chart.svg';
import ChartFilled from '@material-symbols/svg-400/outlined/bar_chart-fill.svg';
import SettingsOutline from '@material-symbols/svg-400/outlined/settings.svg';
import SettingsFilled from '@material-symbols/svg-400/outlined/settings-fill.svg';

// Nav bar design constants
const NAV_BAR_HEIGHT = 64;
const NAV_BAR_PADDING = 4; // Padding between border and active background
const TAB_BG_HEIGHT = NAV_BAR_HEIGHT - 2 - (NAV_BAR_PADDING * 2);
const ICON_SIZE = 28;

// Colors from design spec
const NAV_COLORS = {
  defaultIcon: '#333333',
  defaultText: '#333333',
  selectedIcon: '#201F2D',
  selectedText: '#000000',
  border: 'rgba(255, 255, 255, 0.7)',
  selectedBg: 'rgba(255, 255, 255, 0.55)',
};

// Icon mapping
const ICONS = {
  calendar: { outline: CalendarOutline, filled: CalendarFilled },
  chart: { outline: ChartOutline, filled: ChartFilled },
  settings: { outline: SettingsOutline, filled: SettingsFilled },
};

export default function CustomTabBar({ tabs, currentIndex, onTabPress }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(NAV_BAR_PADDING)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const tabCount = Math.max(1, tabs?.length || 1);
  const navWidth = useMemo(() => {
    const ideal = tabCount === 2 ? 240 : 320;
    return Math.min(ideal, windowWidth - 48);
  }, [tabCount, windowWidth]);

  const tabWidth = containerWidth > 0 ? containerWidth / tabCount : navWidth / tabCount;
  const tabBgWidth = tabWidth - (NAV_BAR_PADDING * 2);
  const tabBgRadius = TAB_BG_HEIGHT / 2;

  useEffect(() => {
    if (!containerWidth) return;
    const targetPosition = NAV_BAR_PADDING + currentIndex * tabWidth;

    Animated.spring(slideAnim, {
      toValue: targetPosition,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [currentIndex, containerWidth, tabWidth]);

  return (
    <BlurView
      intensity={26}
      tint="light"
      style={[
        styles.container,
        {
          width: navWidth,
          bottom: (insets?.bottom ?? 0) + 24,
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.slidingBg,
          {
            width: tabBgWidth,
            borderRadius: tabBgRadius,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      />
      {tabs.map((tab, index) => {
        const isActive = index === currentIndex;
        const iconSet = ICONS[tab.icon];
        const IconComponent = isActive ? iconSet.filled : iconSet.outline;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tabItem, { width: tabWidth }]}
            onPress={() => {
              if (index !== currentIndex) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onTabPress(index);
            }}
            activeOpacity={0.7}
          >
            <IconComponent
              width={ICON_SIZE}
              height={ICON_SIZE}
              fill={isActive ? NAV_COLORS.selectedIcon : NAV_COLORS.defaultIcon}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? NAV_COLORS.selectedText : NAV_COLORS.defaultText },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    borderRadius: NAV_BAR_HEIGHT / 2,
    borderWidth: 1,
    borderColor: NAV_COLORS.border,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  slidingBg: {
    position: 'absolute',
    height: TAB_BG_HEIGHT,
    backgroundColor: NAV_COLORS.selectedBg,
    left: 0,
    top: NAV_BAR_PADDING,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'NotoSans_500Medium',
  },
});

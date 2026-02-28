import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../theme';

// Import SVG icons
import JournalIcon from '../../assets/icons/journal.svg';
import InsightsIcon from '../../assets/icons/insights.svg';
import PlusIcon from '../../assets/icons/plus.svg';

// Nav bar design constants from Figma
const NAV_BAR_HEIGHT = 80;
const NAV_BAR_PADDING = 8;
const TAB_BG_HEIGHT = 64;
const TAB_BG_WIDTH = 146;
const ICON_SIZE = 40;
const FAB_SIZE = 64;

// Colors from Figma design
const NAV_COLORS = {
  text: '#201F2D',
  border: 'rgba(255, 255, 255, 1)',
  navBg: 'rgba(255, 255, 255, 0.4)',
  selectedBg: 'rgba(255, 255, 255, 0.4)',
  fabBg: 'rgba(255, 255, 255, 0.8)',
};

// Icon mapping for tabs
const TAB_ICONS = {
  calendar: JournalIcon,
  chart: InsightsIcon,
};

export default function CustomTabBar({ tabs, currentIndex, onTabPress, onFabPress }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(NAV_BAR_PADDING)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const tabCount = Math.max(1, tabs?.length || 1);
  const navWidth = 248; // Fixed width from Figma

  const tabWidth = TAB_BG_WIDTH;

  useEffect(() => {
    if (!containerWidth) return;
    const targetPosition = NAV_BAR_PADDING + currentIndex * tabWidth;

    Animated.spring(slideAnim, {
      toValue: targetPosition,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [currentIndex, tabWidth]);

  const bottomOffset = (insets?.bottom ?? 0) + 16;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <BlurView
        intensity={16}
        tint="light"
        style={[styles.container, { width: navWidth }]}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {/* Sliding background for active tab */}
        <Animated.View
          style={[
            styles.slidingBg,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        />

        {tabs.map((tab, index) => {
          const isActive = index === currentIndex;
          const IconComponent = TAB_ICONS[tab.icon];

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => {
                if (index !== currentIndex) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onTabPress(index);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                {IconComponent && (
                  <IconComponent width={ICON_SIZE} height={ICON_SIZE} />
                )}
                {isActive && (
                  <Text style={styles.label}>{tab.name}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onFabPress?.();
        }}
        activeOpacity={0.85}
      >
        <BlurView intensity={24} tint="light" style={styles.fabBlur}>
          <PlusIcon width={24} height={24} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: {
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    borderRadius: NAV_BAR_HEIGHT / 2,
    borderWidth: 1,
    borderTopColor: NAV_COLORS.border,
    borderRightColor: NAV_COLORS.border,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    backgroundColor: NAV_COLORS.navBg,
    alignItems: 'center',
    paddingHorizontal: NAV_BAR_PADDING,
    overflow: 'hidden',
    gap: 12,
  },
  slidingBg: {
    position: 'absolute',
    height: TAB_BG_HEIGHT,
    width: TAB_BG_WIDTH,
    backgroundColor: NAV_COLORS.selectedBg,
    borderRadius: TAB_BG_HEIGHT / 2,
    left: 0,
    top: NAV_BAR_PADDING,
  },
  tabItem: {
    width: TAB_BG_WIDTH,
    height: TAB_BG_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: NAV_COLORS.text,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
  },
  fabBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAV_COLORS.fabBg,
  },
});

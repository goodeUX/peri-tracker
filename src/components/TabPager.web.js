import React from 'react';
import { View } from 'react-native';

export default function TabPager({ tabs, initialIndex = 0, onIndexChange, navigation, currentIndex }) {
  const idx = typeof currentIndex === 'number' ? currentIndex : initialIndex;
  const TabComponent = tabs?.[idx]?.component;

  if (!TabComponent) return <View style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <TabComponent navigation={navigation} />
    </View>
  );
}


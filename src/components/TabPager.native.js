import React, { forwardRef } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';

const TabPager = forwardRef(function TabPager(
  { tabs, initialIndex = 0, onIndexChange, navigation },
  ref
) {
  return (
    <PagerView
      ref={ref}
      style={{ flex: 1 }}
      initialPage={initialIndex}
      onPageSelected={(e) => onIndexChange?.(e.nativeEvent.position)}
      scrollEnabled={false}
    >
      {tabs.map((tab) => (
        <View key={tab.name} style={{ flex: 1 }}>
          <tab.component navigation={navigation} />
        </View>
      ))}
    </PagerView>
  );
});

export default TabPager;


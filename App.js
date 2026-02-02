import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
} from '@expo-google-fonts/bricolage-grotesque';

import { getPaperTheme, getColors, fonts } from './src/theme';
import { initDatabase } from './src/database/database';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Import screens
import LogScreen from './src/screens/LogScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

const TABS = [
  { name: 'Journal', icon: 'calendar-month-outline', component: CalendarScreen },
  { name: 'Insights', icon: 'chart-bar', component: InsightsScreen },
  { name: 'Settings', icon: 'cog-outline', component: SettingsScreen },
];

// Custom Tab Bar
function CustomTabBar({ currentIndex, onTabPress, colors }) {
  return (
    <View style={[tabBarStyles.container, { backgroundColor: colors.surface }]}>
      {TABS.map((tab, index) => {
        const isActive = index === currentIndex;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tabBarStyles.tabItem}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <View style={[
              tabBarStyles.iconContainer,
              isActive && { backgroundColor: colors.surfaceVariant }
            ]}>
              <Icon name={tab.icon} size={24} color={colors.text} />
            </View>
            <Text style={[
              tabBarStyles.label,
              { color: isActive ? colors.text : colors.textLight }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    borderRadius: 40,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});

// Tab navigator with PagerView
function TabNavigator({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const pagerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onTabPress = (index) => {
    pagerRef.current?.setPage(index);
  };

  const onPageSelected = (e) => {
    setCurrentIndex(e.nativeEvent.position);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={onPageSelected}
        scrollEnabled={false}
      >
        {TABS.map((tab, index) => (
          <View key={tab.name} style={{ flex: 1 }}>
            <tab.component navigation={navigation} />
          </View>
        ))}
      </PagerView>
      <CustomTabBar
        currentIndex={currentIndex}
        onTabPress={onTabPress}
        colors={colors}
      />
    </View>
  );
}

// Loading screen component
function LoadingScreen({ colors }) {
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Peri Tracker...</Text>
    </View>
  );
}

// Error screen component
function ErrorScreen({ error, onRetry, colors }) {
  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Icon name="alert-circle" size={48} color={colors.error} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
      <Text style={[styles.retryText, { color: colors.primary }]} onPress={onRetry}>
        Tap to retry
      </Text>
    </View>
  );
}

// Main App Content - separated to use theme context
function AppContent() {
  const { isDarkMode, isLoading: themeLoading } = useTheme();
  const colors = getColors(isDarkMode);
  const paperTheme = getPaperTheme(isDarkMode);

  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setIsLoading(false);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    setup();
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    initDatabase()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  };

  if (themeLoading || isLoading || !fontsLoaded) {
    return (
      <PaperProvider theme={paperTheme}>
        <LoadingScreen colors={colors} />
      </PaperProvider>
    );
  }

  if (error) {
    return (
      <PaperProvider theme={paperTheme}>
        <ErrorScreen error={error} onRetry={handleRetry} colors={colors} />
      </PaperProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Log"
              component={LogScreen}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
  },
});

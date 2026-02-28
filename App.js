import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';

import { getPaperTheme, getColors, fonts } from './src/theme';
import { initDatabase } from './src/database/database';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Import screens
import LogScreen from './src/screens/LogScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import components
import TabNavigator from './src/components/TabNavigator';

const Stack = createStackNavigator();

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
    BricolageGrotesque_700Bold,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
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
              name="Settings"
              component={SettingsScreen}
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

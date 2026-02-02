// App theme configuration

// Light mode colors
export const lightColors = {
  // Primary palette - soft, calming purples and pinks
  primary: '#8B5A8C',
  primaryLight: '#B88AB9',
  primaryDark: '#5E3D5F',

  // Secondary palette
  secondary: '#D4A5A5',
  secondaryLight: '#E8D5D5',

  // Accent colors
  accent: '#7BA3A8',
  accentLight: '#A8C9CD',

  // Background colors
  background: '#FAF8F9',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F0F3',

  // Text colors
  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  textLight: '#999999',

  // Status colors
  success: '#6B9E78',
  warning: '#D4A55A',
  error: '#C77171',
  info: '#7B9EC7',

  // Period flow colors
  flowNone: '#E8E8E8',
  flowLight: '#FFCDD2',
  flowMedium: '#EF9A9A',
  flowHeavy: '#E57373',

  // Mood/severity colors (gradient from good to bad)
  mood1: '#C8E6C9',  // Great
  mood2: '#DCEDC8',
  mood3: '#F0F4C3',
  mood4: '#FFF9C4',
  mood5: '#FFECB3',
  mood6: '#FFE0B2',
  mood7: '#FFCCBC',
  mood8: '#FFAB91',
  mood9: '#FF8A65',
  mood10: '#FF7043', // Worst

  // Severity colors (1-5 scale)
  severity1: '#A5D6A7',
  severity2: '#C5E1A5',
  severity3: '#FFF59D',
  severity4: '#FFCC80',
  severity5: '#EF9A9A',
};

// Dark mode colors
export const darkColors = {
  // Primary palette - adjusted for dark mode
  primary: '#B88AB9',
  primaryLight: '#D4A5D5',
  primaryDark: '#8B5A8C',

  // Secondary palette
  secondary: '#D4A5A5',
  secondaryLight: '#4A3535',

  // Accent colors
  accent: '#7BA3A8',
  accentLight: '#3A4A4D',

  // Background colors
  background: '#1A1A1A',
  surface: '#2D2D2D',
  surfaceVariant: '#3A3A3A',

  // Text colors
  text: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textLight: '#808080',

  // Status colors
  success: '#81C784',
  warning: '#FFB74D',
  error: '#E57373',
  info: '#64B5F6',

  // Period flow colors
  flowNone: '#404040',
  flowLight: '#5D3A3D',
  flowMedium: '#8B5A5A',
  flowHeavy: '#B56B6B',

  // Mood/severity colors (gradient from good to bad)
  mood1: '#2E5930',
  mood2: '#3D5930',
  mood3: '#4A5930',
  mood4: '#594A30',
  mood5: '#593D30',
  mood6: '#592E30',
  mood7: '#593030',
  mood8: '#6B3030',
  mood9: '#7D3030',
  mood10: '#8B3030',

  // Severity colors (1-5 scale)
  severity1: '#2E5930',
  severity2: '#3D5930',
  severity3: '#594A30',
  severity4: '#593D30',
  severity5: '#5D3A3D',
};

// Default to light colors for backward compatibility
export const colors = lightColors;

// Function to get colors based on theme
export const getColors = (isDarkMode) => isDarkMode ? darkColors : lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Font families
export const fonts = {
  title: 'BricolageGrotesque_600SemiBold',
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: colors.textLight,
  },
};

// React Native Paper theme configuration
export const paperTheme = {
  colors: {
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.accent,
    tertiaryContainer: colors.accentLight,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    background: colors.background,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.primaryDark,
    onSecondary: '#FFFFFF',
    onSecondaryContainer: colors.text,
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onBackground: colors.text,
    onError: '#FFFFFF',
    outline: '#C4C4C4',
    outlineVariant: '#E0E0E0',
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surfaceVariant,
      level4: colors.surfaceVariant,
      level5: colors.surfaceVariant,
    },
  },
  roundness: borderRadius.md,
};

// Function to get Paper theme based on dark mode
export const getPaperTheme = (isDarkMode) => {
  const themeColors = getColors(isDarkMode);
  return {
    dark: isDarkMode,
    colors: {
      primary: themeColors.primary,
      primaryContainer: themeColors.primaryLight,
      secondary: themeColors.secondary,
      secondaryContainer: themeColors.secondaryLight,
      tertiary: themeColors.accent,
      tertiaryContainer: themeColors.accentLight,
      surface: themeColors.surface,
      surfaceVariant: themeColors.surfaceVariant,
      background: themeColors.background,
      error: themeColors.error,
      onPrimary: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      onPrimaryContainer: themeColors.primaryDark,
      onSecondary: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      onSecondaryContainer: themeColors.text,
      onTertiary: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      onTertiaryContainer: themeColors.text,
      onSurface: themeColors.text,
      onSurfaceVariant: themeColors.textSecondary,
      onBackground: themeColors.text,
      onError: '#FFFFFF',
      outline: isDarkMode ? '#505050' : '#C4C4C4',
      outlineVariant: isDarkMode ? '#404040' : '#E0E0E0',
      elevation: {
        level0: 'transparent',
        level1: themeColors.surface,
        level2: themeColors.surface,
        level3: themeColors.surfaceVariant,
        level4: themeColors.surfaceVariant,
        level5: themeColors.surfaceVariant,
      },
    },
    roundness: borderRadius.md,
  };
};

export default {
  colors,
  lightColors,
  darkColors,
  getColors,
  spacing,
  borderRadius,
  fonts,
  typography,
  paperTheme,
  getPaperTheme,
};

// Symptom definitions with categories
export const SYMPTOMS = [
  // Vasomotor symptoms
  { id: 'hot_flashes', name: 'Hot Flashes', category: 'vasomotor', icon: 'fire' },
  { id: 'night_sweats', name: 'Night Sweats', category: 'vasomotor', icon: 'weather-night' },

  // Sleep symptoms
  { id: 'sleep_disturbances', name: 'Sleep Disturbances', category: 'sleep', icon: 'sleep-off' },

  // Mood symptoms
  { id: 'mood_swings', name: 'Mood Swings', category: 'mood', icon: 'emoticon-confused' },
  { id: 'anxiety', name: 'Anxiety', category: 'mood', icon: 'alert-circle' },
  { id: 'irritability', name: 'Irritability', category: 'mood', icon: 'emoticon-angry' },
  { id: 'depression', name: 'Depression', category: 'mood', icon: 'emoticon-sad' },

  // Cognitive symptoms
  { id: 'brain_fog', name: 'Brain Fog', category: 'cognitive', icon: 'cloud' },
  { id: 'fatigue', name: 'Fatigue', category: 'cognitive', icon: 'battery-low' },
  { id: 'headaches', name: 'Headaches', category: 'cognitive', icon: 'head-alert' },

  // Physical symptoms
  { id: 'joint_pain', name: 'Joint Pain', category: 'physical', icon: 'bone' },
  { id: 'muscle_aches', name: 'Muscle Aches', category: 'physical', icon: 'arm-flex' },
  { id: 'weight_changes', name: 'Weight Changes', category: 'physical', icon: 'scale-bathroom' },
  { id: 'bloating', name: 'Bloating', category: 'physical', icon: 'circle-expand' },

  // Sexual/reproductive symptoms
  { id: 'low_libido', name: 'Low Libido', category: 'sexual', icon: 'heart-off' },
  { id: 'vaginal_dryness', name: 'Vaginal Dryness', category: 'sexual', icon: 'water-off' },
];

export const SYMPTOM_CATEGORIES = [
  { id: 'vasomotor', name: 'Vasomotor', color: '#FF7043' },
  { id: 'sleep', name: 'Sleep', color: '#5C6BC0' },
  { id: 'mood', name: 'Mood', color: '#AB47BC' },
  { id: 'cognitive', name: 'Cognitive', color: '#29B6F6' },
  { id: 'physical', name: 'Physical', color: '#66BB6A' },
  { id: 'sexual', name: 'Sexual/Reproductive', color: '#EC407A' },
];

export const PERIOD_FLOW_OPTIONS = [
  { value: 'none', label: 'None', color: '#E8E8E8' },
  { value: 'spotting', label: 'Spotting', color: '#FFCDD2' },
  { value: 'light', label: 'Light', color: '#EF9A9A' },
  { value: 'medium', label: 'Medium', color: '#E57373' },
  { value: 'heavy', label: 'Heavy', color: '#D32F2F' },
];

export const SEVERITY_LABELS = [
  { value: 1, label: 'Minimal', color: '#A5D6A7' },
  { value: 2, label: 'Mild', color: '#C5E1A5' },
  { value: 3, label: 'Moderate', color: '#FFF59D' },
  { value: 4, label: 'Severe', color: '#FFCC80' },
  { value: 5, label: 'Very Severe', color: '#EF9A9A' },
];

export const MOOD_LABELS = {
  overall: { min: 'Very Low', max: 'Great' },
  anxiety: { min: 'Calm', max: 'Very Anxious' },
  energy: { min: 'Exhausted', max: 'Energetic' },
};

export const SLEEP_QUALITY_LABELS = [
  { value: 1, label: 'Very Poor' },
  { value: 2, label: 'Poor' },
  { value: 3, label: 'Fair' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
];

export const EXERCISE_OPTIONS = [
  { value: 'none', label: 'None', color: '#E8E8E8' },
  { value: 'light', label: 'Light', color: '#C5E1A5' },
  { value: 'moderate', label: 'Moderate', color: '#81C784' },
  { value: 'intense', label: 'Intense', color: '#4CAF50' },
  { value: 'extreme', label: 'Extreme', color: '#2E7D32' },
];

export const FOOD_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor', color: '#EF9A9A' },
  { value: 'fair', label: 'Fair', color: '#FFCC80' },
  { value: 'good', label: 'Good', color: '#FFF59D' },
  { value: 'healthy', label: 'Healthy', color: '#C5E1A5' },
  { value: 'very_healthy', label: 'Very Healthy', color: '#81C784' },
];

export const MEDICATION_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'other', label: 'Other' },
];

// Cycle phase definitions (approximate days)
export const CYCLE_PHASES = {
  menstrual: { name: 'Menstrual', days: [1, 2, 3, 4, 5], color: '#E57373' },
  follicular: { name: 'Follicular', days: [6, 7, 8, 9, 10, 11, 12, 13], color: '#81C784' },
  ovulation: { name: 'Ovulation', days: [14, 15, 16], color: '#64B5F6' },
  luteal: { name: 'Luteal', days: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], color: '#FFB74D' },
};

// Chart colors for different data series
export const CHART_COLORS = [
  '#8B5A8C',
  '#D4A5A5',
  '#7BA3A8',
  '#B88AB9',
  '#A8C9CD',
  '#C4A484',
  '#9BC4BC',
  '#D4B5B0',
];

// Date format helpers
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DISPLAY_DATE_FORMAT = 'MMM D, YYYY';
export const DISPLAY_SHORT_DATE = 'MMM D';

// Default values
export const DEFAULTS = {
  cycleLength: 28,
  periodLength: 5,
  reminderTime: '09:00',
};

export default {
  SYMPTOMS,
  SYMPTOM_CATEGORIES,
  PERIOD_FLOW_OPTIONS,
  SEVERITY_LABELS,
  MOOD_LABELS,
  SLEEP_QUALITY_LABELS,
  EXERCISE_OPTIONS,
  FOOD_QUALITY_OPTIONS,
  MEDICATION_FREQUENCIES,
  CYCLE_PHASES,
  CHART_COLORS,
  DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
  DISPLAY_SHORT_DATE,
  DEFAULTS,
};

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  Button,
  TextInput,
  SegmentedButtons,
  Snackbar,
  Divider,
} from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import { getColors, spacing, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { PERIOD_FLOW_OPTIONS, EXERCISE_OPTIONS, FOOD_QUALITY_OPTIONS } from '../utils/constants';
import SymptomPicker from '../components/SymptomPicker';
import MoodSlider, { SleepQualitySlider, SleepHoursSlider } from '../components/MoodSlider';
import MedicationList from '../components/MedicationList';
import {
  getDailyLog,
  saveDailyLog,
  deleteDailyLog,
  getMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  startPeriod,
  endPeriod,
  getCurrentPeriod,
} from '../database/database';

export default function LogScreen({ route }) {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const selectedDate = route?.params?.date || new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const styles = createStyles(colors);

  // Form state
  const [periodFlow, setPeriodFlow] = useState('none');
  const [symptoms, setSymptoms] = useState([]);
  const [moodOverall, setMoodOverall] = useState(5);
  const [moodAnxiety, setMoodAnxiety] = useState(5);
  const [moodEnergy, setMoodEnergy] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [exerciseLevel, setExerciseLevel] = useState('none');
  const [foodQuality, setFoodQuality] = useState('fair');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState([]);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const [activeSection, setActiveSection] = useState('symptoms');

  const loadData = async () => {
    setLoading(true);
    try {
      const [log, meds, period] = await Promise.all([
        getDailyLog(selectedDate),
        getMedications(true),
        getCurrentPeriod(),
      ]);

      setMedications(meds);
      setCurrentPeriod(period);

      if (log) {
        setHasExistingEntry(true);
        setPeriodFlow(log.period_flow || 'none');
        setSymptoms(
          log.symptoms.map((s) => ({
            symptomId: s.symptom_id,
            severity: s.severity,
          }))
        );
        setMoodOverall(log.mood_overall || 5);
        setMoodAnxiety(log.mood_anxiety || 5);
        setMoodEnergy(log.mood_energy || 5);
        setSleepHours(log.sleep_hours || 7);
        setSleepQuality(log.sleep_quality || 3);
        setExerciseLevel(log.exercise_level || 'none');
        setFoodQuality(log.food_quality || 'fair');
        setNotes(log.notes || '');
        setMedicationLogs(
          log.medicationLogs.map((ml) => ({
            medicationId: ml.medication_id,
            taken: !!ml.taken,
            notes: ml.notes,
          }))
        );
      } else {
        setHasExistingEntry(false);
        // Reset to defaults for new day
        setPeriodFlow('none');
        setSymptoms([]);
        setMoodOverall(5);
        setMoodAnxiety(5);
        setMoodEnergy(5);
        setSleepHours(7);
        setSleepQuality(3);
        setExerciseLevel('none');
        setFoodQuality('fair');
        setNotes('');
        // Initialize medication logs with all medications
        setMedicationLogs(meds.map((m) => ({ medicationId: m.id, taken: false, notes: null })));
      }
    } catch (error) {
      console.error('Error loading log data:', error);
      showSnackbar('Error loading data');
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Handle period flow changes
      if (periodFlow !== 'none' && !currentPeriod) {
        await startPeriod(selectedDate);
      } else if (periodFlow === 'none' && currentPeriod) {
        // Calculate the day before as the end date
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() - 1);
        await endPeriod(currentPeriod.id, endDate.toISOString().split('T')[0]);
      }

      await saveDailyLog({
        date: selectedDate,
        cycleDay: null, // Could calculate this based on period data
        periodFlow,
        moodOverall,
        moodAnxiety,
        moodEnergy,
        sleepHours,
        sleepQuality,
        exerciseLevel,
        foodQuality,
        notes,
        symptoms,
        medicationLogs,
      });

      navigation.navigate('Main', { screen: 'Journal' });
    } catch (error) {
      console.error('Error saving log:', error);
      showSnackbar('Error saving entry');
    }
    setSaving(false);
  };

  const handleAddMedication = async (name, dose, frequency) => {
    try {
      const id = await addMedication(name, dose, frequency);
      const meds = await getMedications(true);
      setMedications(meds);
      setMedicationLogs([...medicationLogs, { medicationId: id, taken: false, notes: null }]);
      showSnackbar('Medication added');
    } catch (error) {
      console.error('Error adding medication:', error);
      showSnackbar('Error adding medication');
    }
  };

  const handleEditMedication = async (id, name, dose, frequency, active) => {
    try {
      await updateMedication(id, name, dose, frequency, active);
      const meds = await getMedications(true);
      setMedications(meds);
      showSnackbar('Medication updated');
    } catch (error) {
      console.error('Error updating medication:', error);
      showSnackbar('Error updating medication');
    }
  };

  const handleDeleteMedication = (id) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(id);
              const meds = await getMedications(true);
              setMedications(meds);
              setMedicationLogs(medicationLogs.filter((ml) => ml.medicationId !== id));
              showSnackbar('Medication deleted');
            } catch (error) {
              console.error('Error deleting medication:', error);
              showSnackbar('Error deleting medication');
            }
          },
        },
      ]
    );
  };

  const handleDeleteEntry = () => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete the entry for ${formatDate(selectedDate)}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDailyLog(selectedDate);
              showSnackbar('Entry deleted');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting entry:', error);
              showSnackbar('Error deleting entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const sectionButtons = [
    { value: 'symptoms', label: 'Symptoms' },
    { value: 'mood', label: 'Mood' },
    { value: 'sleep', label: 'Sleep' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'meds', label: 'Meds' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Header */}
        <Surface style={styles.dateHeader} elevation={1}>
          <Icon name="calendar" size={24} color={colors.primary} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            {isToday && <Text style={styles.todayBadge}>Today</Text>}
          </View>
        </Surface>

        {/* Period Flow */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.flowHeader}>
            <Text style={styles.sectionTitle}>Period Flow</Text>
            <View
              style={[
                styles.flowValueContainer,
                {
                  backgroundColor:
                    PERIOD_FLOW_OPTIONS.find((o) => o.value === periodFlow)?.color ||
                    colors.surfaceVariant,
                },
              ]}
            >
              <Text style={styles.flowValueText}>
                {PERIOD_FLOW_OPTIONS.find((o) => o.value === periodFlow)?.label || 'None'}
              </Text>
            </View>
          </View>
          <Slider
            style={styles.flowSlider}
            minimumValue={0}
            maximumValue={4}
            step={1}
            value={Math.max(0, PERIOD_FLOW_OPTIONS.findIndex((o) => o.value === periodFlow))}
            onValueChange={(index) => {
              const safeIndex = Math.round(Math.min(4, Math.max(0, index)));
              setPeriodFlow(PERIOD_FLOW_OPTIONS[safeIndex].value);
            }}
            minimumTrackTintColor={colors.flowMedium}
            maximumTrackTintColor={colors.surfaceVariant}
            thumbTintColor={colors.flowHeavy}
          />
          <View style={styles.flowLabels}>
            {PERIOD_FLOW_OPTIONS.map((option) => (
              <Text
                key={option.value}
                style={[
                  styles.flowLabel,
                  periodFlow === option.value && styles.flowLabelActive,
                ]}
              >
                {option.label}
              </Text>
            ))}
          </View>
        </Surface>

        {/* Section Tabs */}
        <SegmentedButtons
          value={activeSection}
          onValueChange={setActiveSection}
          buttons={sectionButtons}
          style={styles.sectionTabs}
        />

        {/* Symptoms Section */}
        {activeSection === 'symptoms' && (
          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <SymptomPicker
              selectedSymptoms={symptoms}
              onSymptomsChange={setSymptoms}
            />
          </Surface>
        )}

        {/* Mood Section */}
        {activeSection === 'mood' && (
          <View style={styles.moodSection}>
            <MoodSlider
              label="Overall Mood"
              value={moodOverall}
              onValueChange={setMoodOverall}
              minLabel="Very Low"
              maxLabel="Great"
            />
            <MoodSlider
              label="Energy Level"
              value={moodEnergy}
              onValueChange={setMoodEnergy}
              minLabel="Exhausted"
              maxLabel="Energetic"
            />
            <MoodSlider
              label="Anxiety"
              value={moodAnxiety}
              onValueChange={setMoodAnxiety}
              minLabel="Calm"
              maxLabel="Very Anxious"
            />
          </View>
        )}

        {/* Sleep Section */}
        {activeSection === 'sleep' && (
          <View style={styles.sleepSection}>
            <SleepHoursSlider value={sleepHours} onValueChange={setSleepHours} />
            <SleepQualitySlider value={sleepQuality} onValueChange={setSleepQuality} />
          </View>
        )}

        {/* Lifestyle Section */}
        {activeSection === 'lifestyle' && (
          <View style={styles.lifestyleSection}>
            <Surface style={styles.section} elevation={1}>
              <Text style={styles.sectionTitle}>Exercise</Text>
              <Slider
                style={styles.flowSlider}
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={Math.max(0, EXERCISE_OPTIONS.findIndex((o) => o.value === exerciseLevel))}
                onValueChange={(index) => {
                  const safeIndex = Math.round(Math.min(4, Math.max(0, index)));
                  setExerciseLevel(EXERCISE_OPTIONS[safeIndex].value);
                }}
                minimumTrackTintColor={colors.success}
                maximumTrackTintColor={colors.surfaceVariant}
                thumbTintColor={colors.success}
              />
              <View style={styles.flowLabels}>
                <Text style={styles.flowLabel}>None</Text>
                <Text style={styles.flowLabel}>Light</Text>
                <Text style={styles.flowLabel}>Moderate</Text>
                <Text style={styles.flowLabel}>Intense</Text>
                <Text style={styles.flowLabel}>Extreme</Text>
              </View>
            </Surface>
            <Surface style={styles.section} elevation={1}>
              <Text style={styles.sectionTitle}>Food Quality</Text>
              <Slider
                style={styles.flowSlider}
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={Math.max(0, FOOD_QUALITY_OPTIONS.findIndex((o) => o.value === foodQuality))}
                onValueChange={(index) => {
                  const safeIndex = Math.round(Math.min(4, Math.max(0, index)));
                  setFoodQuality(FOOD_QUALITY_OPTIONS[safeIndex].value);
                }}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.surfaceVariant}
                thumbTintColor={colors.accent}
              />
              <View style={styles.flowLabels}>
                <Text style={styles.flowLabel}>Poor</Text>
                <Text style={styles.flowLabel}>Fair</Text>
                <Text style={styles.flowLabel}>Good</Text>
                <Text style={styles.flowLabel}>Healthy</Text>
                <Text style={styles.flowLabel}>V. Healthy</Text>
              </View>
            </Surface>
          </View>
        )}

        {/* Medications Section */}
        {activeSection === 'meds' && (
          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <MedicationList
              medications={medications}
              medicationLogs={medicationLogs}
              onMedicationLogChange={setMedicationLogs}
              onAddMedication={handleAddMedication}
              onEditMedication={handleEditMedication}
              onDeleteMedication={handleDeleteMedication}
            />
          </Surface>
        )}

        {/* Notes */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes about your day..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Surface>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Entry
        </Button>

        {/* Delete Button - only show for existing entries */}
        {hasExistingEntry && (
          <Button
            mode="outlined"
            onPress={handleDeleteEntry}
            style={styles.deleteButton}
            textColor={colors.error}
            icon="delete"
          >
            Delete Entry
          </Button>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  dateInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  todayBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  section: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  flowValueContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  flowValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  flowSlider: {
    width: '100%',
    height: 40,
  },
  flowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  flowLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  flowLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  sectionTabs: {
    marginBottom: spacing.md,
  },
  moodSection: {
    gap: spacing.sm,
  },
  sleepSection: {
    gap: spacing.sm,
  },
  lifestyleSection: {
    gap: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.surfaceVariant,
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
  deleteButton: {
    marginBottom: spacing.xl,
    borderColor: colors.error,
  },
});

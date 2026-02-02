import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  Button,
  RadioButton,
  Divider,
  ActivityIndicator,
  Snackbar,
  FAB,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors, spacing, borderRadius } from '../theme';
import {
  getLogsInRange,
  getSymptomStats,
  getMoodStats,
  getCycleStats,
  getMedicationCompliance,
} from '../database/database';
import { generateReportHTML } from '../utils/reportGenerator';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [dateRange, setDateRange] = useState('30');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        start: customStartDate,
        end: customEndDate,
      };
    }

    switch (dateRange) {
      case '7':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '180':
        startDate.setDate(startDate.getDate() - 180);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const generateReport = async () => {
    setGenerating(true);

    try {
      const { start, end } = getDateRange();

      // Fetch all data for the report
      const [logs, symptomStats, moodStats, cycleStats, medicationCompliance] =
        await Promise.all([
          getLogsInRange(start, end),
          getSymptomStats(start, end),
          getMoodStats(start, end),
          getCycleStats(),
          getMedicationCompliance(start, end),
        ]);

      if (logs.length === 0) {
        Alert.alert(
          'No Data',
          'There are no log entries in the selected date range. Please select a different range or add some entries first.'
        );
        setGenerating(false);
        return;
      }

      // Generate HTML for the report
      const html = generateReportHTML({
        startDate: start,
        endDate: end,
        logs,
        symptomStats,
        moodStats,
        cycleStats,
        medicationCompliance,
      });

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Health Report',
          UTI: 'com.adobe.pdf',
        });
        showSnackbar('Report generated successfully');
      } else {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device. The report was saved to: ' + uri
        );
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }

    setGenerating(false);
  };

  const previewReport = async () => {
    setGenerating(true);

    try {
      const { start, end } = getDateRange();

      const [logs, symptomStats, moodStats, cycleStats, medicationCompliance] =
        await Promise.all([
          getLogsInRange(start, end),
          getSymptomStats(start, end),
          getMoodStats(start, end),
          getCycleStats(),
          getMedicationCompliance(start, end),
        ]);

      if (logs.length === 0) {
        Alert.alert(
          'No Data',
          'There are no log entries in the selected date range.'
        );
        setGenerating(false);
        return;
      }

      const html = generateReportHTML({
        startDate: start,
        endDate: end,
        logs,
        symptomStats,
        moodStats,
        cycleStats,
        medicationCompliance,
      });

      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error previewing report:', error);
      Alert.alert('Error', 'Failed to preview report. Please try again.');
    }

    setGenerating(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const { start, end } = getDateRange();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Report Info */}
        <Surface style={styles.infoCard} elevation={1}>
          <Icon name="file-document-outline" size={32} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Health Summary Report</Text>
            <Text style={styles.infoText}>
              Generate a PDF report summarizing your symptoms, mood, sleep, and
              cycle data. Perfect for sharing with healthcare providers.
            </Text>
          </View>
        </Surface>

        {/* Date Range Selection */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Report Period</Text>

          <RadioButton.Group onValueChange={setDateRange} value={dateRange}>
            <View style={styles.radioOption}>
              <RadioButton value="7" />
              <Text style={styles.radioLabel}>Last 7 days</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="30" />
              <Text style={styles.radioLabel}>Last 30 days</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="90" />
              <Text style={styles.radioLabel}>Last 3 months</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="180" />
              <Text style={styles.radioLabel}>Last 6 months</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="custom" />
              <Text style={styles.radioLabel}>Custom range</Text>
            </View>
          </RadioButton.Group>

          {dateRange === 'custom' && (
            <View style={styles.customDateSection}>
              <Button
                mode="outlined"
                onPress={() => setShowStartPicker(true)}
                style={styles.dateButton}
              >
                Start: {formatDate(customStartDate)}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowEndPicker(true)}
                style={styles.dateButton}
              >
                End: {formatDate(customEndDate)}
              </Button>
            </View>
          )}

          {showStartPicker && (
            <Calendar
              current={customStartDate || new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                setCustomStartDate(day.dateString);
                setShowStartPicker(false);
              }}
              maxDate={customEndDate || new Date().toISOString().split('T')[0]}
              theme={{
                todayTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
              }}
            />
          )}

          {showEndPicker && (
            <Calendar
              current={customEndDate || new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                setCustomEndDate(day.dateString);
                setShowEndPicker(false);
              }}
              minDate={customStartDate}
              maxDate={new Date().toISOString().split('T')[0]}
              theme={{
                todayTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
              }}
            />
          )}
        </Surface>

        {/* Report Preview */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Report Will Include</Text>

          <View style={styles.includesList}>
            <View style={styles.includeItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.includeText}>Symptom summary and frequency</Text>
            </View>
            <View style={styles.includeItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.includeText}>Mood and energy trends</Text>
            </View>
            <View style={styles.includeItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.includeText}>Sleep patterns</Text>
            </View>
            <View style={styles.includeItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.includeText}>Cycle statistics</Text>
            </View>
            <View style={styles.includeItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.includeText}>Medication compliance</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.dateRangeSummary}>
            <Text style={styles.dateRangeLabel}>Selected period:</Text>
            <Text style={styles.dateRangeValue}>
              {formatDate(start)} - {formatDate(end)}
            </Text>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={previewReport}
            disabled={generating}
            style={styles.previewButton}
            icon="eye"
          >
            Preview
          </Button>
          <Button
            mode="contained"
            onPress={generateReport}
            disabled={generating}
            style={styles.generateButton}
            icon="file-pdf-box"
          >
            {generating ? 'Generating...' : 'Generate & Share'}
          </Button>
        </View>

        {generating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Generating report...</Text>
          </View>
        )}

        {/* Tips */}
        <Surface style={styles.tipCard} elevation={1}>
          <Icon name="lightbulb-outline" size={24} color={colors.warning} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Tips for Healthcare Visits</Text>
            <Text style={styles.tipText}>
              {'\u2022'} Generate a report before your appointment{'\n'}
              {'\u2022'} Highlight specific symptoms you want to discuss{'\n'}
              {'\u2022'} Note any questions you have for your provider
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* FAB for quick log */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Log')}
        color="#FFFFFF"
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
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
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.text,
  },
  customDateSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dateButton: {
    marginBottom: spacing.xs,
  },
  includesList: {
    gap: spacing.sm,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  includeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: spacing.md,
  },
  dateRangeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRangeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateRangeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  previewButton: {
    flex: 1,
  },
  generateButton: {
    flex: 2,
  },
  loadingOverlay: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning + '15',
  },
  tipContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});

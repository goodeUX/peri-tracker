import React, { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, SegmentedButtons, Chip, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getColors, spacing, borderRadius, fonts } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { SYMPTOMS, SEVERITY_LABELS, CHART_COLORS } from '../utils/constants';
import {
  getLogsInRange,
  getSymptomStats,
  getMoodStats,
  getCycleStats,
  getMedicationCompliance,
} from '../database/database';
import { analyzePatterns, getSymptomCorrelations, getTrends } from '../utils/analysis';
import { generateReportHTML } from '../utils/reportGenerator';

const screenWidth = Dimensions.get('window').width;

const getChartConfig = (colors, isDarkMode) => ({
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => isDarkMode ? `rgba(184, 138, 185, ${opacity})` : `rgba(139, 90, 140, ${opacity})`,
  labelColor: (opacity = 1) => isDarkMode ? `rgba(245, 245, 245, ${opacity})` : `rgba(45, 45, 45, ${opacity})`,
  style: {
    borderRadius: borderRadius.md,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
});

export default function InsightsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const chartConfig = useMemo(() => getChartConfig(colors, isDarkMode), [colors, isDarkMode]);
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30');
  const [symptomStats, setSymptomStats] = useState([]);
  const [moodStats, setMoodStats] = useState(null);
  const [cycleStats, setCycleStats] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [trends, setTrends] = useState(null);
  const [logs, setLogs] = useState([]);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const [logsData, symptoms, mood, cycles, medicationCompliance] = await Promise.all([
        getLogsInRange(start, end),
        getSymptomStats(start, end),
        getMoodStats(start, end),
        getCycleStats(),
        getMedicationCompliance(start, end),
      ]);

      if (logsData.length === 0) {
        Alert.alert('No Data', 'There are no log entries in the selected time range.');
        setGenerating(false);
        return;
      }

      const html = generateReportHTML({
        startDate: start,
        endDate: end,
        logs: logsData,
        symptomStats: symptoms,
        moodStats: mood,
        cycleStats: cycles,
        medicationCompliance,
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Health Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing Not Available', 'The report was saved to: ' + uri);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
    setGenerating(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={generateReport}
          disabled={generating}
          style={styles.headerButton}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="file-export-outline" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, generating, timeRange]);

  const loadData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const [logsData, symptoms, mood, cycles] = await Promise.all([
        getLogsInRange(startStr, endStr),
        getSymptomStats(startStr, endStr),
        getMoodStats(startStr, endStr),
        getCycleStats(),
      ]);

      setLogs(logsData);
      setSymptomStats(symptoms);
      setMoodStats(mood);
      setCycleStats(cycles);

      // Run analysis
      const patternData = analyzePatterns(logsData, cycles);
      const correlationData = getSymptomCorrelations(logsData);
      const trendData = getTrends(logsData);

      setPatterns(patternData);
      setCorrelations(correlationData);
      setTrends(trendData);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [timeRange])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSymptomName = (symptomId) => {
    const symptom = SYMPTOMS.find((s) => s.id === symptomId);
    return symptom ? symptom.name : symptomId;
  };

  const timeRangeButtons = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
  ];

  // Prepare mood chart data
  const moodChartData = logs.length > 0 ? {
    labels: logs.slice(-7).map((l) => {
      const date = new Date(l.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: logs.slice(-7).map((l) => l.mood_overall || 5),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
      },
      {
        data: logs.slice(-7).map((l) => l.mood_energy || 5),
        color: (opacity = 1) => colors.accent,
        strokeWidth: 2,
      },
    ],
    legend: ['Mood', 'Energy'],
  } : null;

  // Prepare symptom frequency chart data
  const topSymptoms = symptomStats.slice(0, 5);
  const symptomChartData = topSymptoms.length > 0 ? {
    labels: topSymptoms.map((s) => getSymptomName(s.symptom_id).substring(0, 8)),
    datasets: [{ data: topSymptoms.map((s) => s.count) }],
  } : null;

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Insights</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Time Range Selector */}
        <SegmentedButtons
          value={timeRange}
          onValueChange={setTimeRange}
          buttons={timeRangeButtons}
          style={styles.timeRangeButtons}
        />

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={1}>
            <Icon name="notebook-check" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{logs.length}</Text>
            <Text style={styles.statLabel}>Days Logged</Text>
          </Surface>

          <Surface style={styles.statCard} elevation={1}>
            <Icon name="medical-bag" size={20} color={colors.secondary} />
            <Text style={styles.statValue}>{symptomStats.length}</Text>
            <Text style={styles.statLabel}>Symptoms</Text>
          </Surface>

          <Surface style={styles.statCard} elevation={1}>
            <Icon name="emoticon" size={20} color={colors.warning} />
            <Text style={styles.statValue}>
              {moodStats?.avg_overall ? moodStats.avg_overall.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </Surface>
        </View>

        {/* Mood Trends Chart */}
        {moodChartData && moodChartData.labels.length > 0 && (
          <Surface style={styles.chartCard} elevation={1}>
            <Text style={styles.chartTitle}>Mood & Energy Trends</Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Mood</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>Energy</Text>
              </View>
            </View>
            <LineChart
              data={moodChartData}
              width={screenWidth - spacing.md * 4}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
            />
          </Surface>
        )}

        {/* Top Symptoms Chart */}
        {symptomChartData && symptomChartData.labels.length > 0 && (
          <Surface style={styles.chartCard} elevation={1}>
            <Text style={styles.chartTitle}>Most Frequent Symptoms</Text>
            <BarChart
              data={symptomChartData}
              width={screenWidth - spacing.md * 4}
              height={200}
              chartConfig={{
                ...chartConfig,
                barPercentage: 0.6,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          </Surface>
        )}

        {/* Symptom Severity Breakdown */}
        {symptomStats.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Symptom Details</Text>
            {symptomStats.slice(0, 8).map((stat) => (
              <View key={stat.symptom_id} style={styles.symptomRow}>
                <View style={styles.symptomInfo}>
                  <Text style={styles.symptomName}>
                    {getSymptomName(stat.symptom_id)}
                  </Text>
                  <Text style={styles.symptomCount}>
                    {stat.count} time{stat.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.symptomSeverity}>
                  <Text style={styles.severityText}>
                    Avg: {stat.avg_severity.toFixed(1)}
                  </Text>
                  <View
                    style={[
                      styles.severityBar,
                      {
                        width: `${(stat.avg_severity / 5) * 100}%`,
                        backgroundColor:
                          SEVERITY_LABELS[Math.round(stat.avg_severity) - 1]?.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Surface>
        )}

        {/* Correlations */}
        {correlations.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Symptom Correlations</Text>
            <Text style={styles.cardSubtitle}>
              Symptoms that often appear together
            </Text>
            {correlations.slice(0, 5).map((corr, index) => (
              <View key={index} style={styles.correlationRow}>
                <Chip style={styles.correlationChip} compact>
                  {getSymptomName(corr.symptom1)}
                </Chip>
                <Icon name="arrow-left-right" size={16} color={colors.textLight} />
                <Chip style={styles.correlationChip} compact>
                  {getSymptomName(corr.symptom2)}
                </Chip>
                <Text style={styles.correlationScore}>
                  {Math.round(corr.correlation * 100)}%
                </Text>
              </View>
            ))}
          </Surface>
        )}

        {/* Pattern Insights */}
        {patterns && patterns.insights && patterns.insights.length > 0 && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Pattern Insights</Text>
            {patterns.insights.map((insight, index) => (
              <View key={index} style={styles.insightRow}>
                <Icon
                  name={insight.icon || 'lightbulb-outline'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </Surface>
        )}

        {/* Trends Summary */}
        {trends && (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.cardTitle}>Trend Summary</Text>
            <View style={styles.trendGrid}>
              {trends.moodTrend !== null && (
                <View style={styles.trendItem}>
                  <Icon
                    name={
                      trends.moodTrend > 0
                        ? 'trending-up'
                        : trends.moodTrend < 0
                        ? 'trending-down'
                        : 'trending-neutral'
                    }
                    size={24}
                    color={
                      trends.moodTrend > 0
                        ? colors.success
                        : trends.moodTrend < 0
                        ? colors.error
                        : colors.textSecondary
                    }
                  />
                  <Text style={styles.trendLabel}>Mood</Text>
                  <Text style={styles.trendValue}>
                    {trends.moodTrend > 0 ? '+' : ''}
                    {trends.moodTrend.toFixed(1)}
                  </Text>
                </View>
              )}
              {trends.energyTrend !== null && (
                <View style={styles.trendItem}>
                  <Icon
                    name={
                      trends.energyTrend > 0
                        ? 'trending-up'
                        : trends.energyTrend < 0
                        ? 'trending-down'
                        : 'trending-neutral'
                    }
                    size={24}
                    color={
                      trends.energyTrend > 0
                        ? colors.success
                        : trends.energyTrend < 0
                        ? colors.error
                        : colors.textSecondary
                    }
                  />
                  <Text style={styles.trendLabel}>Energy</Text>
                  <Text style={styles.trendValue}>
                    {trends.energyTrend > 0 ? '+' : ''}
                    {trends.energyTrend.toFixed(1)}
                  </Text>
                </View>
              )}
              {trends.symptomTrend !== null && (
                <View style={styles.trendItem}>
                  <Icon
                    name={
                      trends.symptomTrend < 0
                        ? 'trending-down'
                        : trends.symptomTrend > 0
                        ? 'trending-up'
                        : 'trending-neutral'
                    }
                    size={24}
                    color={
                      trends.symptomTrend < 0
                        ? colors.success
                        : trends.symptomTrend > 0
                        ? colors.error
                        : colors.textSecondary
                    }
                  />
                  <Text style={styles.trendLabel}>Symptoms</Text>
                  <Text style={styles.trendValue}>
                    {trends.symptomTrend > 0 ? '+' : ''}
                    {trends.symptomTrend.toFixed(1)}/day
                  </Text>
                </View>
              )}
            </View>
          </Surface>
        )}

        {/* Empty State */}
        {logs.length === 0 && (
          <Surface style={styles.emptyState} elevation={1}>
            <Icon name="chart-line" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyText}>
              Start logging your symptoms and moods to see insights and patterns
            </Text>
          </Surface>
        )}
      </ScrollView>

    </View>
  );
}

const createStyles = (colors, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets?.top || 0,
  },
  title: {
    fontFamily: fonts.title,
    fontSize: 32,
    color: colors.text,
    marginBottom: spacing.md,
    marginLeft: spacing.lg,
    marginTop: spacing.md,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  timeRangeButtons: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chartCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  symptomInfo: {
    flex: 1,
  },
  symptomName: {
    fontSize: 14,
    color: colors.text,
  },
  symptomCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  symptomSeverity: {
    alignItems: 'flex-end',
    width: 100,
  },
  severityText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  severityBar: {
    height: 4,
    borderRadius: 2,
  },
  correlationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  correlationChip: {
    backgroundColor: colors.surfaceVariant,
  },
  correlationScore: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  headerButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
});

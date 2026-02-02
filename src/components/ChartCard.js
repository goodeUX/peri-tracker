import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { colors, spacing, borderRadius } from '../theme';
import { CHART_COLORS } from '../utils/constants';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(139, 90, 140, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(45, 45, 45, ${opacity})`,
  style: {
    borderRadius: borderRadius.md,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
};

export function LineChartCard({ title, data, labels, yAxisSuffix = '', height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <Surface style={styles.container} elevation={1}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container} elevation={1}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={{
          labels: labels || [],
          datasets: [{ data }],
        }}
        width={screenWidth - spacing.md * 4}
        height={height}
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={true}
      />
    </Surface>
  );
}

export function MultiLineChartCard({ title, datasets, labels, legend, height = 220 }) {
  if (!datasets || datasets.length === 0 || datasets[0].data.length === 0) {
    return (
      <Surface style={styles.container} elevation={1}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </Surface>
    );
  }

  const coloredDatasets = datasets.map((ds, index) => ({
    ...ds,
    color: (opacity = 1) => {
      const baseColor = CHART_COLORS[index % CHART_COLORS.length];
      return baseColor;
    },
    strokeWidth: 2,
  }));

  return (
    <Surface style={styles.container} elevation={1}>
      <Text style={styles.title}>{title}</Text>
      {legend && (
        <View style={styles.legend}>
          {legend.map((item, index) => (
            <View key={item} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
                ]}
              />
              <Text style={styles.legendText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
      <LineChart
        data={{
          labels: labels || [],
          datasets: coloredDatasets,
        }}
        width={screenWidth - spacing.md * 4}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
      />
    </Surface>
  );
}

export function BarChartCard({ title, data, labels, yAxisSuffix = '', height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <Surface style={styles.container} elevation={1}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container} elevation={1}>
      <Text style={styles.title}>{title}</Text>
      <BarChart
        data={{
          labels: labels || [],
          datasets: [{ data }],
        }}
        width={screenWidth - spacing.md * 4}
        height={height}
        yAxisSuffix={yAxisSuffix}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.7,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
    </Surface>
  );
}

export function PieChartCard({ title, data, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <Surface style={styles.container} elevation={1}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </Surface>
    );
  }

  // Add colors to data
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  return (
    <Surface style={styles.container} elevation={1}>
      <Text style={styles.title}>{title}</Text>
      <PieChart
        data={coloredData}
        width={screenWidth - spacing.md * 4}
        height={height}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </Surface>
  );
}

export function StatCard({ title, value, subtitle, icon, color = colors.primary }) {
  return (
    <Surface style={styles.statCard} elevation={1}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Text style={[styles.statIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Surface>
  );
}

export function StatsRow({ stats }) {
  return (
    <View style={styles.statsRow}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyChart: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: spacing.md,
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIconText: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default {
  LineChartCard,
  MultiLineChartCard,
  BarChartCard,
  PieChartCard,
  StatCard,
  StatsRow,
};

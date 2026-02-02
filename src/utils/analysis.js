// Pattern analysis utilities for perimenopause tracking

import { SYMPTOMS, CYCLE_PHASES } from './constants';

/**
 * Analyze patterns in logged data
 */
export function analyzePatterns(logs, cycleStats) {
  const insights = [];

  if (logs.length < 7) {
    return {
      insights: [
        {
          icon: 'information',
          text: 'Continue logging for at least a week to see pattern insights.',
        },
      ],
    };
  }

  // Analyze symptom patterns by day of week
  const dayOfWeekPatterns = analyzeDayOfWeekPatterns(logs);
  if (dayOfWeekPatterns.length > 0) {
    insights.push(...dayOfWeekPatterns);
  }

  // Analyze sleep-symptom correlation
  const sleepInsights = analyzeSleepCorrelation(logs);
  if (sleepInsights.length > 0) {
    insights.push(...sleepInsights);
  }

  // Analyze mood patterns
  const moodInsights = analyzeMoodPatterns(logs);
  if (moodInsights.length > 0) {
    insights.push(...moodInsights);
  }

  // Analyze cycle-related patterns if we have cycle data
  if (cycleStats && cycleStats.cycles && cycleStats.cycles.length >= 2) {
    const cycleInsights = analyzeCyclePatterns(logs, cycleStats);
    if (cycleInsights.length > 0) {
      insights.push(...cycleInsights);
    }
  }

  return { insights };
}

/**
 * Analyze patterns by day of week
 */
function analyzeDayOfWeekPatterns(logs) {
  const insights = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Group symptoms by day of week
  const symptomsByDay = {};
  for (let i = 0; i < 7; i++) {
    symptomsByDay[i] = { count: 0, symptoms: [] };
  }

  for (const log of logs) {
    const dayOfWeek = new Date(log.date).getDay();
    if (log.symptoms && log.symptoms.length > 0) {
      symptomsByDay[dayOfWeek].count += log.symptoms.length;
      symptomsByDay[dayOfWeek].symptoms.push(...log.symptoms);
    }
  }

  // Find peak symptom days
  const dayCounts = Object.entries(symptomsByDay).map(([day, data]) => ({
    day: parseInt(day),
    count: data.count,
  }));

  dayCounts.sort((a, b) => b.count - a.count);

  if (dayCounts[0].count > dayCounts[6].count * 1.5 && dayCounts[0].count > 3) {
    insights.push({
      icon: 'calendar-week',
      text: `You tend to experience more symptoms on ${dayNames[dayCounts[0].day]}s.`,
    });
  }

  return insights;
}

/**
 * Analyze sleep-symptom correlations
 */
function analyzeSleepCorrelation(logs) {
  const insights = [];

  // Group logs by sleep quality
  const logsWithSleep = logs.filter((l) => l.sleep_hours && l.sleep_quality);
  if (logsWithSleep.length < 5) return insights;

  // Calculate average symptoms for good vs poor sleep
  const goodSleepLogs = logsWithSleep.filter((l) => l.sleep_quality >= 4);
  const poorSleepLogs = logsWithSleep.filter((l) => l.sleep_quality <= 2);

  if (goodSleepLogs.length >= 3 && poorSleepLogs.length >= 3) {
    const avgSymptomsGoodSleep =
      goodSleepLogs.reduce((sum, l) => sum + (l.symptoms?.length || 0), 0) /
      goodSleepLogs.length;
    const avgSymptomsPoorSleep =
      poorSleepLogs.reduce((sum, l) => sum + (l.symptoms?.length || 0), 0) /
      poorSleepLogs.length;

    if (avgSymptomsPoorSleep > avgSymptomsGoodSleep * 1.3) {
      insights.push({
        icon: 'sleep',
        text: 'Poor sleep appears to be associated with more symptoms. Prioritizing sleep may help.',
      });
    }
  }

  // Check for fatigue after low sleep
  const lowSleepLogs = logsWithSleep.filter((l) => l.sleep_hours < 6);
  if (lowSleepLogs.length >= 3) {
    const fatigueAfterLowSleep = lowSleepLogs.filter((l) =>
      l.symptoms?.some((s) => s.symptom_id === 'fatigue')
    );
    if (fatigueAfterLowSleep.length / lowSleepLogs.length > 0.5) {
      insights.push({
        icon: 'battery-low',
        text: 'Fatigue commonly follows nights with less than 6 hours of sleep.',
      });
    }
  }

  return insights;
}

/**
 * Analyze mood patterns
 */
function analyzeMoodPatterns(logs) {
  const insights = [];

  const logsWithMood = logs.filter((l) => l.mood_overall);
  if (logsWithMood.length < 7) return insights;

  // Calculate mood variability
  const moodValues = logsWithMood.map((l) => l.mood_overall);
  const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
  const variance =
    moodValues.reduce((sum, m) => sum + Math.pow(m - avgMood, 2), 0) / moodValues.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 2.5) {
    insights.push({
      icon: 'emoticon-confused',
      text: 'Your mood has been quite variable. This can be common during perimenopause.',
    });
  }

  // Check for anxiety-mood correlation
  const logsWithBoth = logs.filter((l) => l.mood_overall && l.mood_anxiety);
  if (logsWithBoth.length >= 7) {
    const highAnxietyLogs = logsWithBoth.filter((l) => l.mood_anxiety >= 7);
    if (highAnxietyLogs.length >= 3) {
      const avgMoodHighAnxiety =
        highAnxietyLogs.reduce((sum, l) => sum + l.mood_overall, 0) / highAnxietyLogs.length;
      if (avgMoodHighAnxiety < avgMood - 1.5) {
        insights.push({
          icon: 'alert-circle',
          text: 'High anxiety days tend to coincide with lower mood. Consider stress-reduction techniques.',
        });
      }
    }
  }

  return insights;
}

/**
 * Analyze cycle-related patterns
 */
function analyzeCyclePatterns(logs, cycleStats) {
  const insights = [];

  // Check cycle length variability
  if (cycleStats.cycleLengths && cycleStats.cycleLengths.length >= 3) {
    const lengths = cycleStats.cycleLengths;
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const maxVariation = Math.max(...lengths.map((l) => Math.abs(l - avgLength)));

    if (maxVariation > 7) {
      insights.push({
        icon: 'calendar-clock',
        text: `Your cycle length varies by up to ${Math.round(maxVariation)} days, which is common in perimenopause.`,
      });
    }
  }

  // Analyze symptoms by cycle phase (if we have enough data)
  const recentCycle = cycleStats.cycles[0];
  if (recentCycle) {
    const phaseSymptoms = analyzeSymptomsByCyclePhase(logs, recentCycle.start_date);
    if (phaseSymptoms) {
      insights.push(...phaseSymptoms);
    }
  }

  return insights;
}

/**
 * Analyze symptoms by cycle phase
 */
function analyzeSymptomsByCyclePhase(logs, cycleStartDate) {
  const insights = [];
  const cycleStart = new Date(cycleStartDate);

  const phaseData = {
    menstrual: { symptoms: [], days: [] },
    follicular: { symptoms: [], days: [] },
    ovulation: { symptoms: [], days: [] },
    luteal: { symptoms: [], days: [] },
  };

  for (const log of logs) {
    const logDate = new Date(log.date);
    const cycleDay = Math.ceil((logDate - cycleStart) / (1000 * 60 * 60 * 24)) + 1;

    if (cycleDay < 1 || cycleDay > 35) continue;

    let phase;
    if (CYCLE_PHASES.menstrual.days.includes(cycleDay)) phase = 'menstrual';
    else if (CYCLE_PHASES.follicular.days.includes(cycleDay)) phase = 'follicular';
    else if (CYCLE_PHASES.ovulation.days.includes(cycleDay)) phase = 'ovulation';
    else phase = 'luteal';

    phaseData[phase].days.push(log);
    if (log.symptoms) {
      phaseData[phase].symptoms.push(...log.symptoms);
    }
  }

  // Find phase with most symptoms
  const phaseCounts = Object.entries(phaseData)
    .filter(([, data]) => data.days.length >= 2)
    .map(([phase, data]) => ({
      phase,
      avgSymptoms: data.symptoms.length / data.days.length,
    }));

  if (phaseCounts.length >= 2) {
    phaseCounts.sort((a, b) => b.avgSymptoms - a.avgSymptoms);
    const worstPhase = phaseCounts[0];

    if (worstPhase.avgSymptoms > phaseCounts[phaseCounts.length - 1].avgSymptoms * 1.5) {
      const phaseNames = {
        menstrual: 'menstrual',
        follicular: 'follicular',
        ovulation: 'ovulation',
        luteal: 'luteal',
      };

      insights.push({
        icon: 'calendar-sync',
        text: `Symptoms tend to be more pronounced during the ${phaseNames[worstPhase.phase]} phase of your cycle.`,
      });
    }
  }

  return insights;
}

/**
 * Calculate correlations between symptoms
 */
export function getSymptomCorrelations(logs) {
  const correlations = [];

  // Get all symptom pairs and their co-occurrence
  const symptomCounts = {};
  const pairCounts = {};

  for (const log of logs) {
    if (!log.symptoms || log.symptoms.length < 2) continue;

    const symptomIds = log.symptoms.map((s) => s.symptom_id);

    for (const id of symptomIds) {
      symptomCounts[id] = (symptomCounts[id] || 0) + 1;
    }

    // Count pairs
    for (let i = 0; i < symptomIds.length; i++) {
      for (let j = i + 1; j < symptomIds.length; j++) {
        const pair = [symptomIds[i], symptomIds[j]].sort().join('|');
        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
      }
    }
  }

  // Calculate correlation scores
  for (const [pair, count] of Object.entries(pairCounts)) {
    if (count < 3) continue;

    const [s1, s2] = pair.split('|');
    const total1 = symptomCounts[s1];
    const total2 = symptomCounts[s2];

    if (total1 < 3 || total2 < 3) continue;

    // Simple co-occurrence ratio
    const correlation = count / Math.min(total1, total2);

    if (correlation > 0.4) {
      correlations.push({
        symptom1: s1,
        symptom2: s2,
        correlation,
        coOccurrences: count,
      });
    }
  }

  // Sort by correlation strength
  correlations.sort((a, b) => b.correlation - a.correlation);

  return correlations.slice(0, 10);
}

/**
 * Calculate trends over time
 */
export function getTrends(logs) {
  if (logs.length < 7) return null;

  // Sort logs by date
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Split into first half and second half
  const midpoint = Math.floor(sortedLogs.length / 2);
  const firstHalf = sortedLogs.slice(0, midpoint);
  const secondHalf = sortedLogs.slice(midpoint);

  // Calculate mood trend
  const firstMood = firstHalf
    .filter((l) => l.mood_overall)
    .reduce((sum, l) => sum + l.mood_overall, 0);
  const firstMoodCount = firstHalf.filter((l) => l.mood_overall).length;
  const secondMood = secondHalf
    .filter((l) => l.mood_overall)
    .reduce((sum, l) => sum + l.mood_overall, 0);
  const secondMoodCount = secondHalf.filter((l) => l.mood_overall).length;

  const moodTrend =
    firstMoodCount > 0 && secondMoodCount > 0
      ? secondMood / secondMoodCount - firstMood / firstMoodCount
      : null;

  // Calculate energy trend
  const firstEnergy = firstHalf
    .filter((l) => l.mood_energy)
    .reduce((sum, l) => sum + l.mood_energy, 0);
  const firstEnergyCount = firstHalf.filter((l) => l.mood_energy).length;
  const secondEnergy = secondHalf
    .filter((l) => l.mood_energy)
    .reduce((sum, l) => sum + l.mood_energy, 0);
  const secondEnergyCount = secondHalf.filter((l) => l.mood_energy).length;

  const energyTrend =
    firstEnergyCount > 0 && secondEnergyCount > 0
      ? secondEnergy / secondEnergyCount - firstEnergy / firstEnergyCount
      : null;

  // Calculate symptom trend (average symptoms per day)
  const firstSymptoms = firstHalf.reduce(
    (sum, l) => sum + (l.symptoms?.length || 0),
    0
  );
  const secondSymptoms = secondHalf.reduce(
    (sum, l) => sum + (l.symptoms?.length || 0),
    0
  );

  const symptomTrend =
    secondSymptoms / secondHalf.length - firstSymptoms / firstHalf.length;

  return {
    moodTrend,
    energyTrend,
    symptomTrend,
    periodAnalyzed: {
      start: sortedLogs[0].date,
      end: sortedLogs[sortedLogs.length - 1].date,
      days: sortedLogs.length,
    },
  };
}

/**
 * Get symptom name by ID
 */
export function getSymptomName(symptomId) {
  const symptom = SYMPTOMS.find((s) => s.id === symptomId);
  return symptom ? symptom.name : symptomId;
}

export default {
  analyzePatterns,
  getSymptomCorrelations,
  getTrends,
  getSymptomName,
};

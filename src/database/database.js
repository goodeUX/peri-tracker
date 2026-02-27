import * as SQLite from 'expo-sqlite';

let db = null;
let isInitializing = false;

// Initialize database connection
export async function initDatabase() {
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return db;
  }

  isInitializing = true;

  try {
    db = await SQLite.openDatabaseAsync('peritracker.db');

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      cycle_day INTEGER,
      period_flow TEXT DEFAULT 'none',
      mood_overall INTEGER,
      mood_anxiety INTEGER,
      mood_energy INTEGER,
      sleep_hours REAL,
      sleep_quality INTEGER,
      exercise_level TEXT DEFAULT 'none',
      food_quality TEXT DEFAULT 'fair',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL,
      symptom_id TEXT NOT NULL,
      severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
      FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dose TEXT,
      frequency TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL,
      medication_id INTEGER NOT NULL,
      taken INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cycle_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      length INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS custom_symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symptom_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      icon TEXT DEFAULT 'plus',
      active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
    CREATE INDEX IF NOT EXISTS idx_symptoms_log_id ON symptoms(log_id);
    CREATE INDEX IF NOT EXISTS idx_cycle_periods_dates ON cycle_periods(start_date, end_date);
  `);

    // Run migrations for columns that may not exist in older databases
    const migrations = [
      "ALTER TABLE daily_logs ADD COLUMN exercise_level TEXT DEFAULT 'none'",
      "ALTER TABLE daily_logs ADD COLUMN food_quality TEXT DEFAULT 'fair'",
    ];

    for (const migration of migrations) {
      try {
        await db.execAsync(migration);
      } catch (e) {
        // Column already exists, ignore error
      }
    }

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Get database instance - will reinitialize if connection is lost
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Wrapper for database operations with auto-reconnect
async function withDatabase(operation) {
  try {
    const database = getDatabase();
    return await operation(database);
  } catch (error) {
    // If we get a null pointer or connection error, try to reinitialize
    if (error.message?.includes('NullPointer') || error.message?.includes('not initialized')) {
      console.log('Database connection lost, reinitializing...');
      db = null;
      await initDatabase();
      const database = getDatabase();
      return await operation(database);
    }
    throw error;
  }
}

// ============ Daily Logs ============

export async function getDailyLog(date) {
  return withDatabase(async (db) => {
    const log = await db.getFirstAsync(
      'SELECT * FROM daily_logs WHERE date = ?',
      [date]
    );

    if (!log) return null;

    // Get symptoms for this log
    const symptoms = await db.getAllAsync(
      'SELECT symptom_id, severity FROM symptoms WHERE log_id = ?',
      [log.id]
    );

    // Get medication logs
    const medicationLogs = await db.getAllAsync(
      `SELECT ml.*, m.name, m.dose
       FROM medication_logs ml
       JOIN medications m ON ml.medication_id = m.id
       WHERE ml.log_id = ?`,
      [log.id]
    );

    return {
      ...log,
      symptoms,
      medicationLogs,
    };
  });
}

export async function saveDailyLog(data) {
  return withDatabase(async (db) => {
    const {
      date,
      cycleDay,
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
    } = data;

    // Check if log exists for this date
    const existing = await db.getFirstAsync(
      'SELECT id FROM daily_logs WHERE date = ?',
      [date]
    );

    let logId;

    if (existing) {
      // Update existing log
      await db.runAsync(
        `UPDATE daily_logs SET
          cycle_day = ?, period_flow = ?,
          mood_overall = ?, mood_anxiety = ?, mood_energy = ?,
          sleep_hours = ?, sleep_quality = ?,
          exercise_level = ?, food_quality = ?,
          notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          cycleDay, periodFlow,
          moodOverall, moodAnxiety, moodEnergy,
          sleepHours, sleepQuality,
          exerciseLevel, foodQuality,
          notes, existing.id,
        ]
      );
      logId = existing.id;

      // Delete existing symptoms and medication logs
      await db.runAsync('DELETE FROM symptoms WHERE log_id = ?', [logId]);
      await db.runAsync('DELETE FROM medication_logs WHERE log_id = ?', [logId]);
    } else {
      // Insert new log
      const result = await db.runAsync(
        `INSERT INTO daily_logs (
          date, cycle_day, period_flow,
          mood_overall, mood_anxiety, mood_energy,
          sleep_hours, sleep_quality,
          exercise_level, food_quality, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          date, cycleDay, periodFlow,
          moodOverall, moodAnxiety, moodEnergy,
          sleepHours, sleepQuality,
          exerciseLevel, foodQuality, notes,
        ]
      );
      logId = result.lastInsertRowId;
    }

    // Insert symptoms
    if (symptoms && symptoms.length > 0) {
      for (const symptom of symptoms) {
        await db.runAsync(
          'INSERT INTO symptoms (log_id, symptom_id, severity) VALUES (?, ?, ?)',
          [logId, symptom.symptomId, symptom.severity]
        );
      }
    }

    // Insert medication logs
    if (medicationLogs && medicationLogs.length > 0) {
      for (const medLog of medicationLogs) {
        await db.runAsync(
          'INSERT INTO medication_logs (log_id, medication_id, taken, notes) VALUES (?, ?, ?, ?)',
          [logId, medLog.medicationId, medLog.taken ? 1 : 0, medLog.notes || null]
        );
      }
    }

    return logId;
  });
}

export async function deleteDailyLog(date) {
  return withDatabase(async (db) => {
    await db.runAsync('DELETE FROM daily_logs WHERE date = ?', [date]);
  });
}

export async function getLogsInRange(startDate, endDate) {
  return withDatabase(async (db) => {
    const logs = await db.getAllAsync(
      'SELECT * FROM daily_logs WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [startDate, endDate]
    );

    // Get symptoms for all logs
    const logIds = logs.map((l) => l.id);
    if (logIds.length === 0) return [];

    const symptoms = await db.getAllAsync(
      `SELECT * FROM symptoms WHERE log_id IN (${logIds.join(',')})`
    );

    const medicationLogs = await db.getAllAsync(
      `SELECT ml.*, m.name, m.dose
       FROM medication_logs ml
       JOIN medications m ON ml.medication_id = m.id
       WHERE ml.log_id IN (${logIds.join(',')})`
    );

    // Group symptoms and medication logs by log_id
    return logs.map((log) => ({
      ...log,
      symptoms: symptoms.filter((s) => s.log_id === log.id),
      medicationLogs: medicationLogs.filter((m) => m.log_id === log.id),
    }));
  });
}

export async function getRecentLogs(limit = 7) {
  return withDatabase(async (db) => {
    const logs = await db.getAllAsync(
      'SELECT * FROM daily_logs ORDER BY date DESC LIMIT ?',
      [limit]
    );

    const logIds = logs.map((l) => l.id);
    if (logIds.length === 0) return [];

    const symptoms = await db.getAllAsync(
      `SELECT * FROM symptoms WHERE log_id IN (${logIds.join(',')})`
    );

    return logs.map((log) => ({
      ...log,
      symptoms: symptoms.filter((s) => s.log_id === log.id),
    }));
  });
}

// ============ Medications ============

export async function getMedications(activeOnly = true) {
  return withDatabase(async (db) => {
    if (activeOnly) {
      return db.getAllAsync('SELECT * FROM medications WHERE active = 1 ORDER BY name');
    }
    return db.getAllAsync('SELECT * FROM medications ORDER BY active DESC, name');
  });
}

export async function addMedication(name, dose, frequency) {
  return withDatabase(async (db) => {
    const result = await db.runAsync(
      'INSERT INTO medications (name, dose, frequency) VALUES (?, ?, ?)',
      [name, dose, frequency]
    );
    return result.lastInsertRowId;
  });
}

export async function updateMedication(id, name, dose, frequency, active) {
  return withDatabase(async (db) => {
    await db.runAsync(
      'UPDATE medications SET name = ?, dose = ?, frequency = ?, active = ? WHERE id = ?',
      [name, dose, frequency, active ? 1 : 0, id]
    );
  });
}

export async function deleteMedication(id) {
  return withDatabase(async (db) => {
    await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
  });
}

// ============ Cycle Periods ============

export async function getCyclePeriods(limit = 12) {
  return withDatabase(async (db) => {
    return db.getAllAsync(
      'SELECT * FROM cycle_periods ORDER BY start_date DESC LIMIT ?',
      [limit]
    );
  });
}

export async function startPeriod(startDate) {
  return withDatabase(async (db) => {
    // Check if there's an unclosed period
    const unclosed = await db.getFirstAsync(
      'SELECT * FROM cycle_periods WHERE end_date IS NULL ORDER BY start_date DESC'
    );

    if (unclosed) {
      // Close the previous period - need to do this inline to avoid nested withDatabase
      const period = await db.getFirstAsync(
        'SELECT start_date FROM cycle_periods WHERE id = ?',
        [unclosed.id]
      );
      if (period) {
        const start = new Date(period.start_date);
        const end = new Date(startDate);
        const length = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        await db.runAsync(
          'UPDATE cycle_periods SET end_date = ?, length = ? WHERE id = ?',
          [startDate, length, unclosed.id]
        );
      }
    }

    const result = await db.runAsync(
      'INSERT INTO cycle_periods (start_date) VALUES (?)',
      [startDate]
    );
    return result.lastInsertRowId;
  });
}

export async function endPeriod(id, endDate) {
  return withDatabase(async (db) => {
    const period = await db.getFirstAsync(
      'SELECT start_date FROM cycle_periods WHERE id = ?',
      [id]
    );

    if (period) {
      const start = new Date(period.start_date);
      const end = new Date(endDate);
      const length = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      await db.runAsync(
        'UPDATE cycle_periods SET end_date = ?, length = ? WHERE id = ?',
        [endDate, length, id]
      );
    }
  });
}

export async function getCurrentPeriod() {
  return withDatabase(async (db) => {
    return db.getFirstAsync(
      'SELECT * FROM cycle_periods WHERE end_date IS NULL ORDER BY start_date DESC'
    );
  });
}

export async function deletePeriod(id) {
  return withDatabase(async (db) => {
    await db.runAsync('DELETE FROM cycle_periods WHERE id = ?', [id]);
  });
}

export async function getPeriodsInRange(startDate, endDate) {
  return withDatabase(async (db) => {
    return db.getAllAsync(
      `SELECT * FROM cycle_periods
       WHERE (start_date >= ? AND start_date <= ?)
          OR (end_date >= ? AND end_date <= ?)
          OR (start_date <= ? AND (end_date >= ? OR end_date IS NULL))
       ORDER BY start_date ASC`,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );
  });
}

// ============ Statistics ============

export async function getSymptomStats(startDate, endDate) {
  return withDatabase(async (db) => {
    return db.getAllAsync(
      `SELECT s.symptom_id,
              COUNT(*) as count,
              AVG(s.severity) as avg_severity,
              MAX(s.severity) as max_severity
       FROM symptoms s
       JOIN daily_logs dl ON s.log_id = dl.id
       WHERE dl.date >= ? AND dl.date <= ?
       GROUP BY s.symptom_id
       ORDER BY count DESC`,
      [startDate, endDate]
    );
  });
}

export async function getMoodStats(startDate, endDate) {
  return withDatabase(async (db) => {
    return db.getFirstAsync(
      `SELECT
        AVG(mood_overall) as avg_overall,
        AVG(mood_anxiety) as avg_anxiety,
        AVG(mood_energy) as avg_energy,
        AVG(sleep_hours) as avg_sleep_hours,
        AVG(sleep_quality) as avg_sleep_quality,
        COUNT(*) as log_count
       FROM daily_logs
       WHERE date >= ? AND date <= ?
         AND (mood_overall IS NOT NULL OR mood_anxiety IS NOT NULL OR mood_energy IS NOT NULL)`,
      [startDate, endDate]
    );
  });
}

export async function getCycleStats() {
  return withDatabase(async (db) => {
    const periods = await db.getAllAsync(
      `SELECT * FROM cycle_periods
       WHERE end_date IS NOT NULL
       ORDER BY start_date DESC
       LIMIT 12`
    );

    if (periods.length < 2) {
      return { averageCycleLength: null, averagePeriodLength: null, cycles: [] };
    }

    // Calculate cycle lengths (time between period starts)
    const cycleLengths = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const current = new Date(periods[i].start_date);
      const previous = new Date(periods[i + 1].start_date);
      const length = Math.ceil((current - previous) / (1000 * 60 * 60 * 24));
      cycleLengths.push(length);
    }

    const periodLengths = periods.filter((p) => p.length).map((p) => p.length);

    return {
      averageCycleLength:
        cycleLengths.length > 0
          ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
          : null,
      averagePeriodLength:
        periodLengths.length > 0
          ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
          : null,
      cycleLengths,
      periodLengths,
      cycles: periods,
    };
  });
}

export async function getMedicationCompliance(startDate, endDate) {
  return withDatabase(async (db) => {
    return db.getAllAsync(
      `SELECT
        m.id, m.name, m.dose,
        COUNT(ml.id) as total_logs,
        SUM(ml.taken) as taken_count
       FROM medications m
       LEFT JOIN medication_logs ml ON m.id = ml.medication_id
       LEFT JOIN daily_logs dl ON ml.log_id = dl.id AND dl.date >= ? AND dl.date <= ?
       WHERE m.active = 1
       GROUP BY m.id`,
      [startDate, endDate]
    );
  });
}

// ============ Custom Symptoms ============

export async function getCustomSymptoms() {
  return withDatabase(async (db) => {
    return db.getAllAsync('SELECT * FROM custom_symptoms WHERE active = 1');
  });
}

export async function addCustomSymptom(name, category = 'custom', icon = 'plus') {
  return withDatabase(async (db) => {
    const symptomId = 'custom_' + Date.now();
    await db.runAsync(
      'INSERT INTO custom_symptoms (symptom_id, name, category, icon) VALUES (?, ?, ?, ?)',
      [symptomId, name, category, icon]
    );
    return symptomId;
  });
}

// ============ Data Export ============

export async function getAllData() {
  return withDatabase(async (db) => {
    const dailyLogs = await db.getAllAsync('SELECT * FROM daily_logs ORDER BY date');
    const symptoms = await db.getAllAsync('SELECT * FROM symptoms');
    const medications = await db.getAllAsync('SELECT * FROM medications');
    const medicationLogs = await db.getAllAsync('SELECT * FROM medication_logs');
    const cyclePeriods = await db.getAllAsync('SELECT * FROM cycle_periods ORDER BY start_date');

    return {
      dailyLogs,
      symptoms,
      medications,
      medicationLogs,
      cyclePeriods,
      exportedAt: new Date().toISOString(),
    };
  });
}

export async function clearAllData() {
  return withDatabase(async (db) => {
    await db.execAsync(`
      DELETE FROM symptoms;
      DELETE FROM medication_logs;
      DELETE FROM daily_logs;
      DELETE FROM cycle_periods;
    `);
  });
}

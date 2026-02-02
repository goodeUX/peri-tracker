// PDF Report Generator for Perimenopause Tracker

import { SYMPTOMS, SEVERITY_LABELS, PERIOD_FLOW_OPTIONS } from './constants';

/**
 * Get symptom name by ID
 */
function getSymptomName(symptomId) {
  const symptom = SYMPTOMS.find((s) => s.id === symptomId);
  return symptom ? symptom.name : symptomId;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate HTML for the health report PDF
 */
export function generateReportHTML({
  startDate,
  endDate,
  logs,
  symptomStats,
  moodStats,
  cycleStats,
  medicationCompliance,
}) {
  const totalDays = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  ) + 1;
  const loggedDays = logs.length;
  const loggingRate = Math.round((loggedDays / totalDays) * 100);

  // Calculate summary statistics
  const avgMood = moodStats?.avg_overall ? moodStats.avg_overall.toFixed(1) : 'N/A';
  const avgEnergy = moodStats?.avg_energy ? moodStats.avg_energy.toFixed(1) : 'N/A';
  const avgAnxiety = moodStats?.avg_anxiety ? moodStats.avg_anxiety.toFixed(1) : 'N/A';
  const avgSleepHours = moodStats?.avg_sleep_hours
    ? moodStats.avg_sleep_hours.toFixed(1)
    : 'N/A';
  const avgSleepQuality = moodStats?.avg_sleep_quality
    ? moodStats.avg_sleep_quality.toFixed(1)
    : 'N/A';

  // Count period days
  const periodDays = logs.filter(
    (l) => l.period_flow && l.period_flow !== 'none'
  ).length;

  // Generate symptom frequency table
  const symptomRows = symptomStats
    .slice(0, 10)
    .map(
      (s) => `
      <tr>
        <td>${getSymptomName(s.symptom_id)}</td>
        <td>${s.count}</td>
        <td>${s.avg_severity.toFixed(1)}</td>
        <td>${s.max_severity}</td>
      </tr>
    `
    )
    .join('');

  // Generate medication compliance table
  const medicationRows = medicationCompliance
    .filter((m) => m.total_logs > 0)
    .map((m) => {
      const compliance = m.total_logs > 0
        ? Math.round((m.taken_count / m.total_logs) * 100)
        : 0;
      return `
        <tr>
          <td>${m.name}${m.dose ? ` (${m.dose})` : ''}</td>
          <td>${m.taken_count} / ${m.total_logs}</td>
          <td>${compliance}%</td>
        </tr>
      `;
    })
    .join('');

  // Generate daily log summary (last 14 days or all if fewer)
  const recentLogs = logs.slice(-14).reverse();
  const dailyLogRows = recentLogs
    .map((log) => {
      const symptoms = log.symptoms
        ? log.symptoms.map((s) => getSymptomName(s.symptom_id)).join(', ')
        : '-';
      const flow = log.period_flow && log.period_flow !== 'none' ? log.period_flow : '-';

      return `
        <tr>
          <td>${formatDate(log.date)}</td>
          <td>${flow}</td>
          <td>${log.mood_overall || '-'}</td>
          <td>${log.mood_energy || '-'}</td>
          <td>${log.sleep_hours ? log.sleep_hours + 'h' : '-'}</td>
          <td class="symptoms-cell">${symptoms}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Health Summary Report</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          padding: 40px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #8B5A8C;
        }

        .header h1 {
          color: #8B5A8C;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .header .date-range {
          color: #666;
          font-size: 14px;
        }

        .header .generated {
          color: #999;
          font-size: 11px;
          margin-top: 4px;
        }

        .section {
          margin-bottom: 25px;
        }

        .section-title {
          color: #8B5A8C;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #E8D5E0;
        }

        .stats-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-box {
          flex: 1;
          min-width: 120px;
          background: #FAF8F9;
          border: 1px solid #E8D5E0;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .stat-box .value {
          font-size: 24px;
          font-weight: bold;
          color: #8B5A8C;
        }

        .stat-box .label {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #E8D5E0;
        }

        th {
          background: #FAF8F9;
          font-weight: 600;
          color: #5E3D5F;
          font-size: 11px;
          text-transform: uppercase;
        }

        td {
          font-size: 12px;
        }

        .symptoms-cell {
          max-width: 200px;
          font-size: 10px;
        }

        .cycle-info {
          background: #FAF8F9;
          border: 1px solid #E8D5E0;
          border-radius: 8px;
          padding: 15px;
        }

        .cycle-info p {
          margin-bottom: 6px;
        }

        .cycle-info strong {
          color: #5E3D5F;
        }

        .notes-section {
          background: #FFFEF7;
          border: 1px solid #E8D5A0;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }

        .notes-section h3 {
          color: #8B6A3C;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .notes-section ul {
          margin-left: 20px;
        }

        .notes-section li {
          margin-bottom: 4px;
          color: #666;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E8D5E0;
          text-align: center;
          color: #999;
          font-size: 10px;
        }

        .disclaimer {
          background: #F5F5F5;
          border-radius: 8px;
          padding: 12px;
          margin-top: 20px;
          font-size: 10px;
          color: #666;
          text-align: center;
        }

        @media print {
          body {
            padding: 20px;
          }
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Perimenopause Health Summary</h1>
        <div class="date-range">${formatDate(startDate)} - ${formatDate(endDate)}</div>
        <div class="generated">Generated on ${formatDate(new Date().toISOString())}</div>
      </div>

      <div class="section">
        <h2 class="section-title">Overview</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="value">${loggedDays}</div>
            <div class="label">Days Logged</div>
          </div>
          <div class="stat-box">
            <div class="value">${loggingRate}%</div>
            <div class="label">Logging Rate</div>
          </div>
          <div class="stat-box">
            <div class="value">${periodDays}</div>
            <div class="label">Period Days</div>
          </div>
          <div class="stat-box">
            <div class="value">${symptomStats.length}</div>
            <div class="label">Unique Symptoms</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Mood & Energy</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="value">${avgMood}</div>
            <div class="label">Avg Mood (1-10)</div>
          </div>
          <div class="stat-box">
            <div class="value">${avgEnergy}</div>
            <div class="label">Avg Energy (1-10)</div>
          </div>
          <div class="stat-box">
            <div class="value">${avgAnxiety}</div>
            <div class="label">Avg Anxiety (1-10)</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Sleep</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="value">${avgSleepHours}</div>
            <div class="label">Avg Hours/Night</div>
          </div>
          <div class="stat-box">
            <div class="value">${avgSleepQuality}</div>
            <div class="label">Avg Quality (1-5)</div>
          </div>
        </div>
      </div>

      ${cycleStats && cycleStats.averageCycleLength ? `
        <div class="section">
          <h2 class="section-title">Cycle Information</h2>
          <div class="cycle-info">
            <p><strong>Average Cycle Length:</strong> ${cycleStats.averageCycleLength} days</p>
            <p><strong>Average Period Length:</strong> ${cycleStats.averagePeriodLength || 'N/A'} days</p>
            <p><strong>Cycles Tracked:</strong> ${cycleStats.cycles?.length || 0}</p>
            ${cycleStats.cycleLengths && cycleStats.cycleLengths.length > 1 ? `
              <p><strong>Cycle Length Range:</strong> ${Math.min(...cycleStats.cycleLengths)} - ${Math.max(...cycleStats.cycleLengths)} days</p>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${symptomStats.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Symptom Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Symptom</th>
                <th>Frequency</th>
                <th>Avg Severity</th>
                <th>Max Severity</th>
              </tr>
            </thead>
            <tbody>
              ${symptomRows}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${medicationRows ? `
        <div class="section">
          <h2 class="section-title">Medication Compliance</h2>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Taken / Logged</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              ${medicationRows}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${recentLogs.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Recent Daily Logs (Last ${recentLogs.length} Days)</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Flow</th>
                <th>Mood</th>
                <th>Energy</th>
                <th>Sleep</th>
                <th>Symptoms</th>
              </tr>
            </thead>
            <tbody>
              ${dailyLogRows}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="notes-section">
        <h3>Discussion Points for Your Healthcare Provider</h3>
        <ul>
          ${symptomStats.length > 0 ? `<li>Most frequent symptoms: ${symptomStats.slice(0, 3).map(s => getSymptomName(s.symptom_id)).join(', ')}</li>` : ''}
          ${avgMood !== 'N/A' && parseFloat(avgMood) < 5 ? '<li>Overall mood has been on the lower side</li>' : ''}
          ${avgAnxiety !== 'N/A' && parseFloat(avgAnxiety) > 6 ? '<li>Experiencing elevated anxiety levels</li>' : ''}
          ${avgSleepHours !== 'N/A' && parseFloat(avgSleepHours) < 6 ? '<li>Sleep duration below recommended levels</li>' : ''}
          ${cycleStats?.cycleLengths && Math.max(...cycleStats.cycleLengths) - Math.min(...cycleStats.cycleLengths) > 10 ? '<li>Significant variation in cycle length</li>' : ''}
          <li>Add your own notes here: _________________________________</li>
        </ul>
      </div>

      <div class="disclaimer">
        This report is generated from self-reported data and is intended for informational purposes only.
        It is not a substitute for professional medical advice, diagnosis, or treatment.
        Always consult with a qualified healthcare provider about your symptoms and health concerns.
      </div>

      <div class="footer">
        Generated by Peri Tracker App
      </div>
    </body>
    </html>
  `;
}

export default { generateReportHTML };

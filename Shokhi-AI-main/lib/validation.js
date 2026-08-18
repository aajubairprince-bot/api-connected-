/**
 * Validation & Gestational Math Helper for Shokhi AI
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function computePregnancyMetrics(week = 1, dueDate = null) {
  let w = parseInt(week, 10);
  if (isNaN(w) || w < 1) w = 1;
  if (w > 42) w = 42;

  let trimester = 1;
  let trimesterLabelBn = "প্রথম ত্রৈমাসিক (১ম-১৩তম সপ্তাহ)";
  let trimesterLabelEn = "1st Trimester (Weeks 1-13)";

  if (w >= 14 && w <= 27) {
    trimester = 2;
    trimesterLabelBn = "দ্বিতীয় ত্রৈমাসিক (১৪তম-২৭তম সপ্তাহ)";
    trimesterLabelEn = "2nd Trimester (Weeks 14-27)";
  } else if (w >= 28) {
    trimester = 3;
    trimesterLabelBn = "তৃতীয় ত্রৈমাসিক (২৮তম-৪০+ সপ্তাহ)";
    trimesterLabelEn = "3rd Trimester (Weeks 28-40+)";
  }

  const daysRemaining = Math.max(0, (40 - w) * 7);

  return {
    pregnancy_week: w,
    trimester,
    trimester_label_bn: trimesterLabelBn,
    trimester_label_en: trimesterLabelEn,
    days_remaining: daysRemaining,
    due_date: dueDate || null
  };
}

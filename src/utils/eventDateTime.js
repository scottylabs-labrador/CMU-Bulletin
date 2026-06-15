export function formatDisplayDate(dateString) {
  if (!dateString) return '';

  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDisplayTime(timeString) {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';

  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeRange(startTime, endTime) {
  const start = formatDisplayTime(startTime);
  if (!start) return '';

  const end = formatDisplayTime(endTime);
  return end ? `${start} – ${end}` : start;
}

export function formatEventDateTime(dateString, timeString, timeEndString) {
  const datePart = formatDisplayDate(dateString);
  if (!datePart) return '';

  const timePart = formatTimeRange(timeString, timeEndString);
  return timePart ? `${datePart} | ${timePart}` : datePart;
}

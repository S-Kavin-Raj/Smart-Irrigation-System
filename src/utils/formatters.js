// Format time duration in seconds to "X min Y sec" or "X sec"
export const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '0 sec';
  const sec = Math.round(seconds);
  if (sec < 60) {
    return `${sec} sec`;
  }
  const mins = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  if (remainingSec === 0) {
    return `${mins} min`;
  }
  return `${mins} min ${remainingSec} sec`;
};

// Format standard 24h/12h time string: "09:42:10 AM"
export const formatTime = (date = new Date()) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Format Date string: "24 Sep 2026"
export const formatDate = (date = new Date()) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Helper to determine moisture status from raw %
export const getMoistureStatus = (moisturePercent, dryThreshold = 35, wetThreshold = 75) => {
  if (moisturePercent <= dryThreshold) return 'Dry';
  if (moisturePercent >= wetThreshold) return 'Wet';
  return 'Normal';
};

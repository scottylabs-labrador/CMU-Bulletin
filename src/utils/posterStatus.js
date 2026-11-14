import { getPosterSortTimestamp } from './sortPosters';

/** Derive a simple display status from a poster's event date. */
export function getPosterStatus(poster, now = Date.now()) {
  if (poster?.repeating) {
    const ts = getPosterSortTimestamp(poster);
    if (!ts) return { key: 'repeating', label: 'Repeating' };
    return ts >= now
      ? { key: 'repeating', label: 'Repeating' }
      : { key: 'past', label: 'Past' };
  }

  const ts = getPosterSortTimestamp(poster);
  if (!ts) return { key: 'unknown', label: 'No date' };
  return ts >= now
    ? { key: 'upcoming', label: 'Upcoming' }
    : { key: 'past', label: 'Past' };
}

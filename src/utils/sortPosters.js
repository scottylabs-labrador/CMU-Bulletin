export const POSTER_SORT_OPTIONS = [
  { value: 'time', label: 'Event time' },
  { value: 'name', label: 'Event name' },
  { value: 'organizer', label: 'Organizer' },
];

export const DEFAULT_POSTER_SORT = 'time';
export const DEFAULT_POSTER_SORT_DIRECTION = 'asc';

export const getPosterSortTimestamp = (poster) => {
  const dateStr = poster.sort_date
    || (poster.repeating ? poster.next_occurring_date : poster.single_event_date);

  if (!dateStr) return 0;

  const timeStr = poster.repeating
    ? (poster.event_time || poster.single_event_time || '00:00')
    : (poster.single_event_time || '00:00');

  return new Date(`${dateStr}T${timeStr}:00`).getTime();
};

export const getPosterOrganizerSortKey = (poster, uploaderNames = {}) =>
  (poster.organizer || uploaderNames[poster.uploaded_by] || '').toLowerCase();

const compareCreatedAt = (a, b) => {
  const createdAtA = a.created_at?.toDate?.() || new Date(0);
  const createdAtB = b.created_at?.toDate?.() || new Date(0);
  return createdAtA - createdAtB;
};

export function sortPosters(
  posters,
  sortBy = DEFAULT_POSTER_SORT,
  uploaderNames = {},
  sortDirection = DEFAULT_POSTER_SORT_DIRECTION
) {
  const sorted = [...posters];
  const direction = sortDirection === 'desc' ? -1 : 1;

  sorted.sort((a, b) => {
    if (sortBy === 'name') {
      const nameCompare = (a.title || '').localeCompare(b.title || '', undefined, {
        sensitivity: 'base',
      });
      if (nameCompare !== 0) return nameCompare * direction;

      const timeCompare = getPosterSortTimestamp(a) - getPosterSortTimestamp(b);
      if (timeCompare !== 0) return timeCompare;

      return compareCreatedAt(a, b);
    }

    if (sortBy === 'organizer') {
      const organizerCompare = getPosterOrganizerSortKey(a, uploaderNames).localeCompare(
        getPosterOrganizerSortKey(b, uploaderNames),
        undefined,
        { sensitivity: 'base' }
      );
      if (organizerCompare !== 0) return organizerCompare * direction;

      const timeCompare = getPosterSortTimestamp(a) - getPosterSortTimestamp(b);
      if (timeCompare !== 0) return timeCompare;

      return compareCreatedAt(a, b);
    }

    const timeCompare = getPosterSortTimestamp(a) - getPosterSortTimestamp(b);
    if (timeCompare !== 0) return timeCompare * direction;

    return compareCreatedAt(a, b);
  });

  return sorted;
}

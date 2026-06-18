import { normalizePosterLocations, posterHasCustomLocation } from '../components/PosterFilters';

export const isRecurringEventOnDate = (poster, checkDateString) => {
  if (!poster.repeating || !poster.next_occurring_date) {
    return false;
  }

  const checkDate = new Date(`${checkDateString}T00:00:00`);
  const startDate = new Date(`${poster.next_occurring_date}T00:00:00`);

  if (checkDate < startDate) {
    return false;
  }

  const frequency = poster.frequency;
  const daysOfWeek = poster.days_of_week || [];
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const checkDayName = dayMap[checkDate.getDay()];

  if (daysOfWeek.length > 0 && !daysOfWeek.includes(checkDayName)) {
    return false;
  }

  switch (frequency) {
    case 'daily':
      return true;

    case 'weekly':
      return true;

    case 'bi-weekly': {
      const weekStartForStartDate = new Date(startDate.getTime());
      weekStartForStartDate.setDate(startDate.getDate() - startDate.getDay());
      weekStartForStartDate.setHours(0, 0, 0, 0);

      const weekStartForCheckDate = new Date(checkDate.getTime());
      weekStartForCheckDate.setDate(checkDate.getDate() - checkDate.getDay());
      weekStartForCheckDate.setHours(0, 0, 0, 0);

      const weekDiff = Math.round((weekStartForCheckDate - weekStartForStartDate) / (1000 * 60 * 60 * 24 * 7));

      return weekDiff % 2 === 0;
    }

    case 'monthly':
      return startDate.getDate() === checkDate.getDate();

    default:
      return false;
  }
};

export const findNextOccurrence = (poster, fromDateString) => {
  if (!poster.repeating || !poster.next_occurring_date) {
    return null;
  }

  const fromDate = new Date(`${fromDateString}T00:00:00`);
  const startDate = new Date(`${poster.next_occurring_date}T00:00:00`);

  let checkDate = new Date(Math.max(fromDate.getTime(), startDate.getTime()));

  const searchLimit = new Date(fromDate);
  searchLimit.setFullYear(searchLimit.getFullYear() + 1);

  while (checkDate <= searchLimit) {
    const checkDateFormatted = checkDate.toISOString().split('T')[0];
    if (isRecurringEventOnDate(poster, checkDateFormatted)) {
      return checkDateFormatted;
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return null;
};

export function filterPosters(
  posters,
  {
    filterCategory = 'All',
    filterDate = '',
    filterLocations = [],
    filterTags = [],
    searchQuery = '',
    excludePastEvents = true,
  } = {}
) {
  let currentPosters = posters;

  if (excludePastEvents && !filterDate) {
    const today = new Date().toISOString().split('T')[0];
    currentPosters = currentPosters.filter((poster) => {
      if (poster.repeating) {
        return findNextOccurrence(poster, today) !== null;
      }
      return poster.single_event_date >= today;
    });
  }

  if (filterCategory !== 'All') {
    currentPosters = currentPosters.filter(
      (poster) => poster.category && poster.category.includes(filterCategory)
    );
  }

  if (filterDate) {
    currentPosters = currentPosters.filter((poster) => {
      if (poster.repeating) {
        return isRecurringEventOnDate(poster, filterDate);
      }
      return poster.single_event_date === filterDate;
    });
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    currentPosters = currentPosters.filter(
      (poster) =>
        poster.title.toLowerCase().includes(query) ||
        poster.description.toLowerCase().includes(query)
    );
  }

  if (filterLocations.length > 0) {
    currentPosters = currentPosters.filter((poster) => {
      const posterLocs = normalizePosterLocations(poster.location).map((loc) => loc.toLowerCase());

      return filterLocations.some((location) => {
        if (location === 'Other') {
          return posterHasCustomLocation(poster);
        }
        return posterLocs.includes(location.toLowerCase());
      });
    });
  }

  if (filterTags.length > 0) {
    currentPosters = currentPosters.filter((poster) =>
      filterTags.some((tag) =>
        (poster.tags || []).map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      )
    );
  }

  return currentPosters;
}

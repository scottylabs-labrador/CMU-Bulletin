import React, { useState, useEffect, useMemo, useCallback } from 'react';

export const POSTER_MASONRY_BREAKPOINTS = {
  default: 5,
  1400: 4,
  1100: 3,
  768: 2,
  500: 1,
};

function getColumnCount(width, breakpoints) {
  const sortedBreakpoints = Object.entries(breakpoints)
    .filter(([key]) => key !== 'default')
    .map(([key, cols]) => [Number(key), cols])
    .sort((a, b) => b[0] - a[0]);

  for (const [breakpoint, cols] of sortedBreakpoints) {
    if (width <= breakpoint) return cols;
  }

  return breakpoints.default;
}

function distributePosters(posters, columnCount, heightWeights, extraWeight = 0) {
  const columns = Array.from({ length: columnCount }, () => []);
  const columnHeights = Array(columnCount).fill(0);

  posters.forEach((poster) => {
    let shortestIndex = 0;
    for (let i = 1; i < columnCount; i += 1) {
      if (columnHeights[i] < columnHeights[shortestIndex]) {
        shortestIndex = i;
      }
    }

    columns[shortestIndex].push(poster);
    columnHeights[shortestIndex] += (heightWeights[poster.id] || 1) + extraWeight;
  });

  return columns;
}

function PosterMasonry({ posters, renderPoster, actionExtraWeight = 0 }) {
  const [columnCount, setColumnCount] = useState(() =>
    getColumnCount(window.innerWidth, POSTER_MASONRY_BREAKPOINTS)
  );
  const [heightWeights, setHeightWeights] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth, POSTER_MASONRY_BREAKPOINTS));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const registerHeight = useCallback((posterId, naturalWidth, naturalHeight) => {
    if (!naturalWidth || !naturalHeight) return;

    const aspectRatio = naturalHeight / naturalWidth;
    setHeightWeights((prev) => {
      if (prev[posterId] === aspectRatio) return prev;
      return { ...prev, [posterId]: aspectRatio };
    });
  }, []);

  const columns = useMemo(
    () => distributePosters(posters, columnCount, heightWeights, actionExtraWeight),
    [posters, columnCount, heightWeights, actionExtraWeight]
  );

  if (posters.length === 0) return null;

  return (
    <div className="poster-grid">
      <div className="poster-masonry">
        {columns.map((columnPosters, columnIndex) => (
          <div key={columnIndex} className="poster-masonry-column">
            {columnPosters.map((poster) => renderPoster(poster, registerHeight))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PosterMasonry;

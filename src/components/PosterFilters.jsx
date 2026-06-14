import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MultiSelectDropdown from './MultiSelectDropdown';
import './PosterFilters.css';

function CategoryScrollArrow({ direction, visible, onClick, label }) {
  return (
    <button
      type="button"
      className={`category-bar-arrow category-bar-arrow--${direction}${visible ? ' category-bar-arrow--visible' : ''}`}
      onClick={onClick}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {direction === 'left' ? (
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

function PosterFilters({
  filterDate,
  setFilterDate,
  filterLocations,
  setFilterLocations,
  filterTags,
  setFilterTags,
  availableTags,
  toggleViewMode,
  viewMode,
  activeCategory,
  setSearchQuery,
}) {
  const navigate = useNavigate();
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const categories = ['All', 'career', 'club', 'performance', 'sport', 'social', 'academic'];

  const availableLocations = [
    'University Center',
    'Hunt Library',
    'Purnell',
    'CFA',
    'Wean',
    'Gates',
    'Tepper',
    'The Cut',
    'Baker-Porter',
    'Posner',
    'Scaife',
    'Online',
    'Off-Campus',
    'Other',
  ];

  const updateScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    const overflow = el.scrollWidth > el.clientWidth + 1;
    setHasOverflow(overflow);
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();

    const el = categoryScrollRef.current;
    if (!el) return undefined;

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    window.addEventListener('resize', updateScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollCategories = (direction) => {
    const el = categoryScrollRef.current;
    if (!el) return;

    const scrollAmount = Math.max(el.clientWidth * 0.6, 160);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleResetFilters = () => {
    setFilterDate('');
    setFilterLocations([]);
    setFilterTags([]);
    setSearchQuery('');
    navigate('/');
  };

  return (
    <>
      <div className="filter-bar">
        <div className="navbar-flavor-text">Discover what’s going on!</div>

        <div className="filter-bar__controls">
          <button
            type="button"
            className="filter-reset-link"
            onClick={handleResetFilters}
          >
            Reset filters
          </button>

          <input
            type="date"
            className="filter-control filter-control--date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <MultiSelectDropdown
            label={
              <>
                <img src="/location-icon.svg" alt="" />
                Location
              </>
            }
            options={availableLocations}
            selectedOptions={filterLocations}
            onChange={setFilterLocations}
          />

          <MultiSelectDropdown
            label={
              <>
                <img src="/tag-icon.svg" alt="" />
                Tags
              </>
            }
            options={availableTags}
            selectedOptions={filterTags}
            onChange={setFilterTags}
          />

          <button
            type="button"
            className="filter-control filter-control--view"
            onClick={toggleViewMode}
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
        </div>
      </div>

      <div className="category-bar-wrap">
        <CategoryScrollArrow
          direction="left"
          visible={hasOverflow && canScrollLeft}
          onClick={() => scrollCategories('left')}
          label="Scroll categories left"
        />

        <div
          ref={categoryScrollRef}
          className={`category-bar${!hasOverflow ? ' category-bar--centered' : ''}`}
          onScroll={updateScrollState}
        >
          {categories.map((cat) => (
            <div className="event-category" key={cat}>
              <Link
                to={cat === 'All' ? '/' : `/${cat}`}
                className={activeCategory === cat ? 'active' : ''}
              >
                <div className="icon-wrap">
                  <img
                    src={`/${cat.toLowerCase()}.svg`}
                    alt={`${cat.toLowerCase()} icon`}
                  />
                </div>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Link>
            </div>
          ))}
        </div>

        <CategoryScrollArrow
          direction="right"
          visible={hasOverflow && canScrollRight}
          onClick={() => scrollCategories('right')}
          label="Scroll categories right"
        />
      </div>
    </>
  );
}

export default PosterFilters;

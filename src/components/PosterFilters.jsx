import React from 'react';
import { Link } from 'react-router-dom';
import MultiSelectDropdown from './MultiSelectDropdown';

function PosterFilters({
  filterDate,
  setFilterDate,
  filterLocations,
  setFilterLocations,
  filterTags,
  setFilterTags,
  availableTags,
  toggleViewMode,
  activeCategory
}) {
  
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

  return (
    <>
      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="navbar-flavor-text">Discover what’s going on!</div>

        <input
          className="choose-date"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />

        <MultiSelectDropdown
          label={
            <>
              <img src="./location-icon.svg" alt="Location" />
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
              <img src="./tag-icon.svg" alt="Tags" />
              Tags
            </>
          }
          options={availableTags}
          selectedOptions={filterTags}
          onChange={setFilterTags}
        />

        <button onClick={toggleViewMode}>
          Toggle View
        </button>
      </div>

      {/* CATEGORY BAR */}
      <div className="category-bar">
        {categories.map(cat => (
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
    </>
  );
}

export default PosterFilters;

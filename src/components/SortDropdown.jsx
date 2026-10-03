import React, { useState, useRef, useEffect } from 'react';
import { POSTER_SORT_OPTIONS } from '../utils/sortPosters';
import './SortDropdown.css';

function SortDropdown({ sortBy, sortDirection, onSortByChange, onSortDirectionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    if (value === sortBy) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    onSortByChange(value);
    onSortDirectionChange('asc');
  };

  return (
    <div className="sort-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`filter-control sort-dropdown__toggle${isOpen ? ' sort-dropdown__toggle--open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Sort posters"
      >
        <span className="sort-dropdown__label">
          <img src="/time-icon.svg" alt="" />
          Sort
        </span>
        <img src="/drop-down-icon.svg" alt="" className="sort-dropdown__chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="sort-dropdown__menu" role="listbox" aria-label="Sort options">
          {POSTER_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={sortBy === option.value}
              className={`sort-dropdown__option${sortBy === option.value ? ' sort-dropdown__option--active' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {sortBy === option.value && (
                <span className="sort-dropdown__direction" aria-hidden="true">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SortDropdown;

import React, { useState, useRef, useEffect, useMemo } from 'react';

function LocationSearchInput({
  premadeOptions,
  selectedPremade,
  customLocations,
  onChange,
  placeholder = 'Search locations…',
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const premadePool = useMemo(
    () => premadeOptions.filter((option) => option !== 'Other'),
    [premadeOptions]
  );

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const filteredPremadeOptions = useMemo(() => {
    const availablePremade = premadePool.filter((option) => !selectedPremade.includes(option));

    if (!normalizedQuery) {
      return availablePremade;
    }

    return availablePremade.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [premadePool, normalizedQuery, selectedPremade, trimmedQuery]);

  const queryMatchesPremade = premadePool.some(
    (option) => option.toLowerCase() === normalizedQuery
  );

  const isAlreadySelected =
    selectedPremade.some((location) => location.toLowerCase() === normalizedQuery) ||
    customLocations.some((location) => location.toLowerCase() === normalizedQuery);

  const showCustomOption =
    Boolean(trimmedQuery) && !queryMatchesPremade && !isAlreadySelected;

  const updateSelection = (nextPremade, nextCustom) => {
    onChange({ premade: nextPremade, custom: nextCustom });
  };

  const addPremadeLocation = (location) => {
    const value = location.trim();
    if (!value || !premadePool.includes(value) || selectedPremade.includes(value)) {
      setQuery('');
      setIsOpen(false);
      return;
    }

    updateSelection([...selectedPremade, value], customLocations);
    setQuery('');
    setIsOpen(false);
  };

  const addCustomLocation = (location) => {
    const value = location.trim();
    if (!value) return;

    const alreadyUsed =
      selectedPremade.some((item) => item.toLowerCase() === value.toLowerCase()) ||
      customLocations.some((item) => item.toLowerCase() === value.toLowerCase());

    if (alreadyUsed) {
      setQuery('');
      setIsOpen(false);
      return;
    }

    updateSelection(selectedPremade, [...customLocations, value]);
    setQuery('');
    setIsOpen(false);
  };

  const removePremadeLocation = (location) => {
    updateSelection(
      selectedPremade.filter((item) => item !== location),
      customLocations
    );
  };

  const removeCustomLocation = (location) => {
    updateSelection(
      selectedPremade,
      customLocations.filter((item) => item !== location)
    );
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCustomOption) {
        addCustomLocation(trimmedQuery);
      } else if (filteredPremadeOptions.length > 0) {
        addPremadeLocation(filteredPremadeOptions[0]);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalSelected = selectedPremade.length + customLocations.length;
  const showMenu = isOpen && (filteredPremadeOptions.length > 0 || showCustomOption);

  return (
    <div className="poster-upload-location-search" ref={rootRef}>
      {totalSelected > 0 && (
        <div className="poster-upload-location-search__selected">
          {selectedPremade.map((location) => (
            <span key={`premade-${location}`} className="poster-upload-location-search__pill">
              {location}
              <button
                type="button"
                className="poster-upload-location-search__pill-remove"
                onClick={() => removePremadeLocation(location)}
                aria-label={`Remove ${location}`}
              >
                ×
              </button>
            </span>
          ))}
          {customLocations.map((location) => (
            <span
              key={`custom-${location}`}
              className="poster-upload-location-search__pill poster-upload-location-search__pill--custom"
            >
              {location}
              <button
                type="button"
                className="poster-upload-location-search__pill-remove"
                onClick={() => removeCustomLocation(location)}
                aria-label={`Remove custom location ${location}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        className="poster-upload-location-search__input"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={totalSelected > 0 ? 'Add another location…' : placeholder}
        aria-label="Search locations"
        aria-expanded={showMenu}
        aria-haspopup="listbox"
        autoComplete="off"
      />

      {showMenu && (
        <ul className="poster-upload-location-search__menu" role="listbox">
          {filteredPremadeOptions.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="poster-upload-location-search__option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addPremadeLocation(option)}
              >
                {option}
              </button>
            </li>
          ))}
          {showCustomOption && (
            <li>
              <button
                type="button"
                className="poster-upload-location-search__option poster-upload-location-search__option--custom"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addCustomLocation(trimmedQuery)}
              >
                Custom location: <strong>{trimmedQuery}</strong>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default LocationSearchInput;

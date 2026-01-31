import React, { useState, useRef, useEffect } from 'react';
import './MultiSelectDropdown.css';

function MultiSelectDropdown({ label, options, selectedOptions, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    onChange(prev =>
      checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <button type="button" className="dropdown-toggle" onClick={handleToggle}>
        <span className="dropdown-label">
          {label}
        </span>
        
        : {selectedOptions.length > 0 ? `${selectedOptions.length} Selected` : ''}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map(option => (
            <label key={option}>
              <input
                type="checkbox"
                value={option}
                checked={selectedOptions.includes(option)}
                onChange={handleCheckboxChange}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;

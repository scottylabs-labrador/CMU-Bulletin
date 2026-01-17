import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import MultiSelectDropdown from './MultiSelectDropdown';

function Navbar({ user, activeCategory, filterDate, setFilterDate, filterLocations, setFilterLocations, filterTags, setFilterTags, searchQuery, setSearchQuery, availableTags, toggleViewMode }) {
  const [searchInput, setSearchInput] = useState('');
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';
  const isAuthPage = location.pathname === '/auth';

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    setSearchQuery(e.target.value);
  };

  const categories = ['All', 'career', 'club', 'performance', 'sports', 'wellness']; // Hardcoded sorted
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
    <header>
      <div className="top-bar">
        <div className = "title-logo"> 
          <img src = "./logo-small.png"></img>
          <h1 class="website-title">
            <Link to="/">CMU <br/>Bulletin</Link>
          </h1>
        </div>

        <div className = "search-bar">
          <h2>search bar will go here!</h2>
        </div> 

        {/* search bar is currently implemented lower down... 
        want to work on filtering w both icons + search query*/}
        
        
        <div>
          {user ? (
            <>
              <Link to="/post" className="btn" style={{ marginRight: '10px' }}>Post</Link>
              <Link to="/profile" className="btn">Profile</Link>
            </>
          ) : (
            <Link to="/auth" className="btn">Sign In</Link>
          )}
        </div>
      </div>

      {!isProfilePage && !isAuthPage && (
        <div className="category-bar">
          {categories.map(cat => (
            <Link 
              key={cat} 
              to={cat === 'All' ? '/' : `/${cat}`}
              className={activeCategory === cat ? 'active' : ''}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          ))}
        </div>
      )}

      {!isProfilePage && !isAuthPage && (
        <div className="filter-bar">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <MultiSelectDropdown
            label="Location"
            options={availableLocations}
            selectedOptions={filterLocations}
            onChange={setFilterLocations}
          />
          <MultiSelectDropdown
            label="Tags"
            options={availableTags}
            selectedOptions={filterTags}
            onChange={setFilterTags}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchInput}
            onChange={handleSearchChange}
          />
          
          <button onClick={toggleViewMode}>
            {toggleViewMode ? 'List' : 'Grid'} View
          </button>

        </div>
      )}
    </header>
  );
}

export default Navbar;
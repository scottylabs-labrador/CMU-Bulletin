import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

function Navbar({ user, searchQuery, setSearchQuery }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);  

  const isProfilePage = location.pathname === '/profile';
  const isAuthPage = location.pathname === '/authsignup' || location.pathname === '/authlogin';

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // const categories = ['All', 'career', 'club', 'social', 'performance', 'sports', 'academic', 'wellness']; // Hardcoded sorted
  const categories = ['All', 'career', 'club', 'performance', 'sport', 'social', 'academic']; // shortened list for testing


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
      <div className="page-content navbar-content">
        <div className="top-bar">
        <div className="title-logo"> 
          <Link to="/" className="logo-button-link">
            <img src="./logo-small.svg" alt="CMU Logo" />
            <h1 className="website-title">
              CMU <br/> Bulletin
            </h1>
          </Link>
        </div>

        <div className = "search-bar">
          <img src="./search-icon.svg" alt="Search" className="search-icon" />
          
          <input
            type="text"
            placeholder="Search for events, information..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div> 
        

        <div className="nav-buttons-container">
          {user ? (
            <>
              <Link to="/post" className="createbtn">
                <img src="/plus-icon.svg" alt="plus icon"/>
                <span>Create</span>
              </Link>

              <button className="clearbtn">
                <img src="/heart-icon.svg" alt="heart icon" />
              </button>

              <button className="clearbtn">
                <img src="/bell-icon.svg" alt="bell icon" />
              </button>

              <Link to="/profile" className="clearbtn" style={{ '--size': '36px' }}>
                <img src="/tester-pfp-icon.svg" alt="Profile Picture" />
              </Link>
              
              <button className="clearbtn" onClick={toggleDropdown} style={{ '--size': '28px' }}>
                <img src="/drop-down-icon.svg" alt="Toggle Dropdown" />
              </button>

              {/*This is the actual menu that appears/disappears
              {isOpen && (
                <ul style={{ position: 'absolute', right: 0, backgroundColor: 'white', border: '1px solid #ccc', listStyle: 'none', padding: '10px' }}>
                  <li><Link to="/settings" onClick={() => setIsOpen(false)}>Settings</Link></li>
                  <li><Link to="/logout" onClick={() => setIsOpen(false)}>Logout</Link></li>
                </ul>
              )}
              DROPDOWN SECTION END */}
            </>
          ) : (
            <>
            
            <Link to="/authlogin" className="clearloginbtn">
              <span>Log In</span>
            </Link>
            
            <Link to="/authsignup" className="blackbtn">
            <span>Sign Up</span>
            </Link>
            
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
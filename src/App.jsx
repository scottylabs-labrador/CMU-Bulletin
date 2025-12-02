import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import PosterUpload from './components/PosterUpload';
import PosterList from './components/PosterList';
import UserProfile from './components/UserProfile';
import EditPoster from './components/EditPoster';
import { auth, db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Auth from './components/Auth';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterLocations, setFilterLocations] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const location = useLocation();

  const [viewMode, setViewMode] = useState('grid');  // Default to 'grid'
  
  // Function to toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    const unsubscribePosters = onSnapshot(collection(db, 'posters'), (snapshot) => {
      const allTags = {};
      snapshot.docs.forEach(doc => {
        const posterData = doc.data();
        if (posterData.tags && Array.isArray(posterData.tags)) {
          posterData.tags.forEach(tag => {
            const lowerCaseTag = tag.toLowerCase();
            allTags[lowerCaseTag] = (allTags[lowerCaseTag] || 0) + 1;
          });
        } else if (posterData.tags && typeof posterData.tags === 'string') {
          // Handle comma-separated string tags from older posts
          posterData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '').forEach(tag => {
            const lowerCaseTag = tag.toLowerCase();
            allTags[lowerCaseTag] = (allTags[lowerCaseTag] || 0) + 1;
          });
        }
      });

      const sortedTags = Object.entries(allTags)
        .sort(([, countA], [, countB]) => countB - countA) // Sort by count descending
        .map(([tag]) => tag); // Get only the tag names

      setAvailableTags(sortedTags);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosters();
    };
  }, []);

  const activeCategory = location.pathname.substring(1) || 'All';
  const isProfilePage = location.pathname === '/profile' || location.pathname.startsWith('/edit-poster');

  return (
    <div>
      <Navbar 
        user={user} 
        activeCategory={activeCategory}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterLocations={filterLocations}
        setFilterLocations={setFilterLocations}
        filterTags={filterTags}
        setFilterTags={setFilterTags}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        availableTags={availableTags}
        toggleViewMode={toggleViewMode}
      />
      <main className="container" style={{ paddingTop: isProfilePage ? '0' : '30px' }}>
        <Routes>
          <Route path="/" element={<PosterList filterDate={filterDate} filterLocations={filterLocations} filterTags={filterTags} searchQuery={searchQuery} user={user} viewMode={viewMode} />} />
          <Route path="/:category" element={<PosterList filterDate={filterDate} filterLocations={filterLocations} filterTags={filterTags} searchQuery={searchQuery} user={user} viewMode={viewMode} />} />
          <Route path="/post" element={<PosterUpload user={user} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/edit-poster/:id" element={<EditPoster />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

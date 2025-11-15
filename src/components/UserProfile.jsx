import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import './UserProfile.css'; // Import the new CSS file

function UserProfile() {
  const [userPosts, setUserPosts] = useState([]);
  const [likedPostersData, setLikedPostersData] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderNames, setUploaderNames] = useState({});
  const [userData, setUserData] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      });

      const q = query(collection(db, 'posters'), where('uploaded_by', '==', currentUser.uid));
      const unsubscribePosts = onSnapshot(q, async (snapshot) => {
        const postsData = snapshot.docs.map((doc) => {
          const poster = { id: doc.id, ...doc.data() };
          // Attach googleCalUrl for in-profile display (QR + link)
          poster.googleCalUrl = createGoogleCalendarLink(poster);
          return poster;
        });
        setUserPosts(postsData);

        const uploaderIds = [...new Set(postsData.map(p => p.uploaded_by))];
        const names = {};
        for (const poster of postsData) {
          if (poster.organizer) {
            names[poster.id] = poster.organizer;
          } else if (poster.uploaded_by && !names[poster.uploaded_by]) {
            const userDoc = await getDoc(doc(db, 'users', poster.uploaded_by));
            if (userDoc.exists()) {
              names[poster.uploaded_by] = `${userDoc.data().firstName} ${userDoc.data().lastName}`;
            }
          }
        }
        setUploaderNames(names);
      });

      const likedRef = collection(db, `users/${currentUser.uid}/likedPosters`);
      const unsubscribeLiked = onSnapshot(likedRef, async (snapshot) => {
        const likedIds = snapshot.docs.map(doc => doc.id);
        const fetchedLikedPosters = [];
        for (const id of likedIds) {
          const posterDoc = await getDoc(doc(db, 'posters', id));
          if (posterDoc.exists()) {
            const poster = { id: posterDoc.id, ...posterDoc.data() };
            poster.googleCalUrl = createGoogleCalendarLink(poster);
            fetchedLikedPosters.push(poster);
          }
        }
        setLikedPostersData(fetchedLikedPosters);

        const uploaderIds = [...new Set(fetchedLikedPosters.map(p => p.uploaded_by))];
        const names = {};
        for (const poster of fetchedLikedPosters) {
          if (poster.organizer) {
            names[poster.id] = poster.organizer;
          } else if (poster.uploaded_by && !names[poster.uploaded_by]) {
            const userDoc = await getDoc(doc(db, 'users', poster.uploaded_by));
            if (userDoc.exists()) {
              names[poster.uploaded_by] = `${userDoc.data().firstName} ${userDoc.data().lastName}`;
            }
          }
        }
        setUploaderNames(prevNames => ({ ...prevNames, ...names }));
      });

      return () => {
        unsubscribeUser();
        unsubscribePosts();
        unsubscribeLiked();
      };
    }
  }, [currentUser]);

  // -------------------------
  // Calendar link helpers
  // -------------------------
  // Build Google Calendar event date/time strings and a share link
  // Supports timed events and all-day events. For repeating events we use the
  // next occurring date as the event instance.
  const toGoogleDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;

    if (!timeStr) {
      const start = dateStr.replace(/-/g, '');
      const d = new Date(`${dateStr}T00:00:00`);
      d.setDate(d.getDate() + 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const end = `${year}${month}${day}`;
      return `${start}/${end}`;
    }

    const local = new Date(`${dateStr}T${timeStr}:00`);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, '0');
    const d = String(local.getUTCDate()).padStart(2, '0');
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const min = String(local.getUTCMinutes()).padStart(2, '0');
    const ss = '00';
    return `${y}${m}${d}T${hh}${min}${ss}Z`;
  };

  const createGoogleCalendarLink = (poster) => {
    if (!poster) return null;
    const title = poster.title || 'Event';
    const description = poster.description || '';
    const location = Array.isArray(poster.location) ? poster.location.join(', ') : (poster.location || '');

    const today = new Date().toISOString().split('T')[0];
    const eventDate = poster.single_event_date || poster.next_occurring_date || (poster.repeating ? findNextOccurrence(poster, today) : null);
    if (!eventDate) return null;

    const hasStart = Boolean(poster.start_time);
    const hasEnd = Boolean(poster.end_time);

    let datesParam = '';
    if (hasStart && hasEnd) {
      const start = toGoogleDateTime(eventDate, poster.start_time);
      const end = toGoogleDateTime(eventDate, poster.end_time);
      datesParam = `${start}/${end}`;
    } else {
      datesParam = toGoogleDateTime(eventDate, undefined);
    }

    const details = poster.repeating ? `${description}\n\n(Recurring: ${poster.frequency || 'repeating'})` : description;

    const params = new URLSearchParams();
    params.set('action', 'TEMPLATE');
    params.set('text', title);
    params.set('dates', datesParam);
    if (details) params.set('details', details);
    if (location) params.set('location', location);

    return `https://www.google.com/calendar/render?${params.toString()}`;
  };

  useEffect(() => {
    if (selectedPoster && selectedPoster.uploaded_by) {
      const fetchUploaderName = async () => {
        const userDoc = await getDoc(doc(db, 'users', selectedPoster.uploaded_by));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUploaderName(`${userData.firstName} ${userData.lastName}`);
        } else {
          setUploaderName('Unknown');
        }
      };
      fetchUploaderName();
    }
  }, [selectedPoster]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posters', postId));
        alert('Post deleted successfully!');
      } catch (error) {
        console.error("Error deleting post:", error);
        alert('Error deleting post.');
      }
    }
  };

  const navigate = useNavigate();

  const handleEditPost = (postId) => {
    navigate(`/edit-poster/${postId}`);
  };

  const handlePosterClick = (poster) => {
    setSelectedPoster(poster);
  };

  const handleCloseModal = () => {
    setSelectedPoster(null);
  };

  const handleLikeToggle = async (posterId) => {
    if (!currentUser) {
      alert('Please sign in to like posters.');
      return;
    }
    const likedRef = doc(db, `users/${currentUser.uid}/likedPosters`, posterId);
    const isLiked = likedPostersData.some(poster => poster.id === posterId);

    try {
      if (isLiked) {
        await deleteDoc(likedRef);
      } else {
        await setDoc(likedRef, {});
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Error toggling like: ' + error.message);
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <h2>Please sign in to view your profile.</h2>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-info">
        <h2>User Profile</h2>
        {userData && (
          <>
            <p><strong>Name:</strong> {userData.firstName} {userData.lastName}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            {userData.organization && <p><strong>Organization:</strong> {userData.organization}</p>}
          </>
        )}
        <button onClick={handleSignOut} className="btn">Sign Out</button>
      </div>

      <div className="profile-posts">
        <h3>Your Posts</h3>
            {userPosts.length === 0 ? (
          <p>You haven't posted anything yet.</p>
        ) : (
          <div className="poster-grid">
            {userPosts.map((poster) => (
                  <div key={poster.id} className="poster-card" onClick={() => handlePosterClick(poster)}>
                    <img src={poster.image_url} alt={poster.title} />
                    <div className="poster-card-content">
                      <h4>{poster.title}</h4>
                      <p><strong>{poster.organizer ? 'Organizer:' : 'Posted by:'}</strong> {poster.organizer || uploaderNames[poster.uploaded_by] || 'Unknown'}</p>
                      <p>{poster.description}</p>

                      {poster.googleCalUrl && (
                        <div className="calendar-export-section" style={{ marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <QRCodeSVG value={poster.googleCalUrl} size={80} level="L" />
                            <div>
                              <a href={poster.googleCalUrl} target="_blank" rel="noopener noreferrer" className="calendar-link">Add to Google Calendar</a>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '10px' }}>
                        <button onClick={(e) => {e.stopPropagation(); handleEditPost(poster.id)}} className="btn">Edit</button>
                        <button onClick={(e) => {e.stopPropagation(); handleDeletePost(poster.id)}} className="btn" style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>Delete</button>
                      </div>
                    </div>
                  </div>
            ))}
          </div>
        )}

        <h3>Liked Posters</h3>
        {likedPostersData.length === 0 ? (
          <p>You haven't liked any posters yet.</p>
        ) : (
          <div className="poster-grid">
            {likedPostersData.map((poster) => (
              <div key={poster.id} className="poster-card" onClick={() => handlePosterClick(poster)}>
                <img src={poster.image_url} alt={poster.title} />
                <div className="poster-card-content">
                  <h4>{poster.title}</h4>
                  <p><strong>{poster.organizer ? 'Organizer:' : 'Posted by:'}</strong> {poster.organizer || uploaderNames[poster.uploaded_by] || 'Unknown'}</p>
                  <p>{poster.description}</p>

                  {poster.googleCalUrl && (
                    <div className="calendar-export-section" style={{ marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <QRCodeSVG value={poster.googleCalUrl} size={80} level="L" />
                        <div>
                          <a href={poster.googleCalUrl} target="_blank" rel="noopener noreferrer" className="calendar-link">Add to Google Calendar</a>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPoster && (
        <Modal 
          poster={selectedPoster} 
          onClose={handleCloseModal} 
          user={currentUser}
          likedPosters={likedPostersData.map(p => p.id)} // Pass only IDs for liked status check
          handleLikeToggle={handleLikeToggle}
          uploaderName={uploaderName}
        />
      )}
    </div>
  );
}

export default UserProfile;

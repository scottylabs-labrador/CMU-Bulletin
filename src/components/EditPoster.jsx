import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import MultiSelectDropdown from './MultiSelectDropdown';

function EditPoster() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState([]);
  const [otherLocation, setOtherLocation] = useState('');
  const [category, setCategory] = useState([]);
  const [image, setImage] = useState(null);
  const [tags, setTags] = useState('');
  const [repeating, setRepeating] = useState(false);
  const [singleEventDate, setSingleEventDate] = useState('');
  const [singleEventTime, setSingleEventTime] = useState('');
  const [singleEventTimeEnd, setSingleEventTimeEnd] = useState('');
  const [nextOccurringDate, setNextOccurringDate] = useState('');
  const [frequency, setFrequency] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // To display existing image

  const availableCategories = ['career', 'club', 'performance', 'sports', 'wellness'];
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

  useEffect(() => {
    const fetchPoster = async () => {
      if (!id) return;
      const docRef = doc(db, 'posters', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setOrganizer(data.organizer || '');
        setDescription(data.description || '');
        
        // Handle location (can be string or array)
        if (Array.isArray(data.location)) {
          setLocation(data.location.filter(loc => availableLocations.includes(loc)));
          const otherLoc = data.location.find(loc => !availableLocations.includes(loc));
          if (otherLoc) {
            setLocation(prev => [...prev, 'Other']);
            setOtherLocation(otherLoc);
          }
        } else if (typeof data.location === 'string') {
          // For older posts with single string location
          if (availableLocations.includes(data.location)) {
            setLocation([data.location]);
          } else {
            setLocation(['Other']);
            setOtherLocation(data.location);
          }
        }

        setCategory(data.category || []);
        setCurrentImageUrl(data.image_url || null);
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || ''); // Tags are string, convert array to string if needed
        setRepeating(data.repeating || false);
        setSingleEventDate(data.single_event_date || '');
        setSingleEventTime(data.single_event_time || '');
        setSingleEventTimeEnd(data.single_event_time_end || '');
        setNextOccurringDate(data.next_occurring_date || '');
        setFrequency(data.frequency || '');
        setDaysOfWeek(data.days_of_week || []);
      } else {
        console.error("No such document!");
        navigate('/profile'); // Redirect if post not found
      }
    };

    fetchPoster();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImage(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDayChange = (e) => {
    const { value, checked } = e.target;
    setDaysOfWeek(prev => 
      checked ? [...prev, value] : prev.filter(day => day !== value)
    );
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setCategory(prev =>
      checked ? [...prev, value] : prev.filter(c => c !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('You must be logged in to edit a poster.');
      return;
    }
    if (category.length === 0) {
      setError('Please select at least one category.');
      return;
    }
    if (location.length === 0) {
      setError('Please select at least one location.');
      return;
    }
    if (location.includes('Other') && !otherLocation.trim()) {
      setError('Please specify the other location.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      let finalLocations = [...location];
      if (location.includes('Other')) {
        finalLocations = finalLocations.filter(loc => loc !== 'Other');
        finalLocations.push(otherLocation.trim());
      }

      const updatedData = {
        title,
        organizer,
        description,
        location: finalLocations,
        category,
        uploaded_by: auth.currentUser.uid,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        repeating,
        image_filename: `${title.split(' ')[0] || 'untitled'}.png`,
        sort_date: repeating ? nextOccurringDate : singleEventDate,
      };

      if (image) {
        updatedData.image_url = image; // Only update image if a new one is selected
      }

      if (repeating) {
        updatedData.next_occurring_date = nextOccurringDate;
        updatedData.frequency = frequency;
        updatedData.days_of_week = daysOfWeek;
        updatedData.single_event_date = '';
        updatedData.single_event_time = '';
        updatedData.single_event_time_end = '';
      } else {
        updatedData.single_event_date = singleEventDate;
        updatedData.single_event_time = singleEventTime || '';
        updatedData.single_event_time_end = singleEventTimeEnd || '';
        updatedData.next_occurring_date = '';
        updatedData.frequency = '';
        updatedData.days_of_week = [];
      }

      await updateDoc(doc(db, 'posters', id), updatedData);

      setSuccess(true);
      setUploading(false);
      alert('Poster updated successfully!');
      navigate('/profile'); // Redirect back to profile after update

    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Edit Poster</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Organizer:</label>
          <input type="text" value={organizer} onChange={(e) => setOrganizer(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div>
          <label>Location:</label>
          <MultiSelectDropdown
            label="Select Location"
            options={availableLocations}
            selectedOptions={location}
            onChange={setLocation}
          />
          {location.includes('Other') && (
            <div>
              <label>Specify Other Location:</label>
              <input type="text" value={otherLocation} onChange={(e) => setOtherLocation(e.target.value)} required={location.includes('Other')} />
            </div>
          )}
        </div>
        <div>
          <label>Categories:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {availableCategories.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  value={cat}
                  checked={category.includes(cat)}
                  onChange={handleCategoryChange}
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label>Current Image:</label>
          {currentImageUrl && <img src={currentImageUrl} alt="Current Poster" style={{ maxWidth: '200px', maxHeight: '200px', marginBottom: '10px' }} />}
          <label>Change Image (optional):</label>
          <input type="file" onChange={handleImageChange} accept="image/*" />
        </div>
        <div>
          <label>Tags (comma-separated):</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div>
          <label>
            <input type="checkbox" checked={repeating} onChange={(e) => setRepeating(e.target.checked)} />
            Repeating Event
          </label>
        </div>

        {!repeating && (
          <>
            <div>
              <label>Event Date:</label>
              <input type="date" value={singleEventDate} onChange={(e) => setSingleEventDate(e.target.value)} />
            </div>
            <div>
              <label>Time (optional):</label>
              <input type="time" value={singleEventTime} onChange={(e) => setSingleEventTime(e.target.value)} />
            </div>
            <div>
              <label>End time (optional):</label>
              <input type="time" value={singleEventTimeEnd} onChange={(e) => setSingleEventTimeEnd(e.target.value)} />
            </div>
          </>
        )}

        {repeating && (
          <>
            <div>
              <label>Next Occurring Date:</label>
              <input type="date" value={nextOccurringDate} onChange={(e) => setNextOccurringDate(e.target.value)} />
            </div>
            <div>
              <label>Frequency:</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="">Select Frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Every other week</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label>Days of Week:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      value={day}
                      checked={daysOfWeek.includes(day)}
                      onChange={handleDayChange}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={uploading} className="btn">
          {uploading ? 'Updating...' : 'Update Poster'}
        </button>
        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">Poster updated successfully!</p>}
      </form>
    </div>
  );
}

export default EditPoster;

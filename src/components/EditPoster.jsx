import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import LocationSearchInput from './LocationSearchInput';
import TagInput from './TagInput';
import {
  POSTER_CATEGORY_OPTIONS,
  PREMADE_LOCATIONS,
  PREMADE_LOCATION_SET,
} from './PosterFilters';
import './PosterUpload.css';

const daysOfWeekOptions = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function splitLocations(locations) {
  const premade = [];
  const custom = [];

  locations.forEach((location) => {
    if (PREMADE_LOCATION_SET.has(location)) {
      premade.push(location);
    } else if (location && location !== 'Other') {
      custom.push(location);
    }
  });

  return { premade, custom };
}

function mergeLocations(premade, custom) {
  return [...premade, ...custom];
}

function normalizeLocations(rawLocation) {
  if (!rawLocation) return [];
  const locations = Array.isArray(rawLocation) ? rawLocation : [rawLocation];
  return locations.filter((location) => location && location !== 'Other');
}

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) {
    return rawTags.filter((tag) => typeof tag === 'string' && tag.trim() !== '');
  }
  if (typeof rawTags === 'string' && rawTags.trim()) {
    return rawTags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function processImageFile(file, onComplete, onInvalid) {
  if (!file || !file.type.startsWith('image/')) {
    onInvalid?.();
    return false;
  }

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
      } else if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      onComplete(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
  return true;
}

function EditPoster() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState([]);
  const [category, setCategory] = useState([]);
  const [image, setImage] = useState(null);
  const [tags, setTags] = useState([]);
  const [repeating, setRepeating] = useState(false);
  const [singleEventDate, setSingleEventDate] = useState('');
  const [singleEventTime, setSingleEventTime] = useState('');
  const [singleEventTimeEnd, setSingleEventTimeEnd] = useState('');
  const [nextOccurringDate, setNextOccurringDate] = useState('');
  const [frequency, setFrequency] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPoster = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'posters', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          navigate('/profile');
          return;
        }

        const data = docSnap.data();

        if (auth.currentUser && data.uploaded_by !== auth.currentUser.uid) {
          navigate('/profile');
          return;
        }

        setTitle(data.title || '');
        setOrganizer(data.organizer || '');
        setDescription(data.description || '');
        setLocation(normalizeLocations(data.location));
        setCategory(Array.isArray(data.category) ? data.category : []);
        setCurrentImageUrl(data.image_url || null);
        setTags(normalizeTags(data.tags));
        setRepeating(Boolean(data.repeating));
        setSingleEventDate(data.single_event_date || '');
        setSingleEventTime(data.single_event_time || '');
        setSingleEventTimeEnd(data.single_event_time_end || '');
        setNextOccurringDate(data.next_occurring_date || '');
        setFrequency(data.frequency || '');
        setDaysOfWeek(Array.isArray(data.days_of_week) ? data.days_of_week : []);
      } catch (err) {
        console.error('Failed to load poster:', err);
        setError('Failed to load poster.');
      } finally {
        setLoading(false);
      }
    };

    fetchPoster();
  }, [id, navigate]);

  const handleImageFile = (file) => {
    const accepted = processImageFile(
      file,
      setImage,
      () => setError('Please upload a valid image file.')
    );
    if (accepted) setError(null);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDayChange = (event) => {
    const { value, checked } = event.target;
    setDaysOfWeek((prev) =>
      checked ? [...prev, value] : prev.filter((day) => day !== value)
    );
  };

  const handleCategoryChange = (event) => {
    const { value, checked } = event.target;
    setCategory((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  const handleLocationChange = ({ premade, custom }) => {
    setLocation(mergeLocations(premade, custom));
  };

  const { premade: selectedPremade, custom: customLocations } = splitLocations(location);
  const displayImage = image || currentImageUrl;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!auth.currentUser) {
      setError('You must be logged in to edit a poster.');
      return;
    }
    if (category.length === 0) {
      setError('Please select at least one category.');
      return;
    }
    if (location.length === 0) {
      setError('Please add at least one location.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedData = {
        title,
        organizer,
        description,
        location,
        category,
        uploaded_by: auth.currentUser.uid,
        tags,
        repeating,
        image_filename: `${title.split(' ')[0] || 'untitled'}.png`,
        sort_date: repeating ? nextOccurringDate : singleEventDate,
      };

      if (image) {
        updatedData.image_url = image;
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
      setTimeout(() => navigate('/profile'), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const dropzoneClassName = [
    'poster-upload-dropzone',
    isDragging ? 'poster-upload-dropzone--dragging' : '',
    displayImage ? 'poster-upload-dropzone--has-image' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className="page-content poster-upload-page">
        <div className="poster-upload-container">
          <p className="poster-upload-message">Loading poster…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content poster-upload-page">
      <div className="poster-upload-container">
        <form className="poster-upload-form" onSubmit={handleSubmit}>
          <div className="poster-upload-header">
            <h2>Edit Poster</h2>
            <div className="poster-upload-header__actions">
              <button
                type="button"
                className="poster-upload-cancel"
                onClick={() => navigate('/profile')}
              >
                Cancel
              </button>
              <button type="submit" disabled={uploading} className="poster-upload-submit">
                {uploading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="poster-upload-columns">
            <div className="poster-upload-image-col">
              <div
                className={dropzoneClassName}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    keyEvent.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Change poster image"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="poster-upload-dropzone__input"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                {displayImage ? (
                  <>
                    <img
                      src={displayImage}
                      alt="Poster preview"
                      className="poster-upload-dropzone__preview"
                    />
                    <span className="poster-upload-dropzone__change">Click to change image</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="poster-upload-dropzone__graphic"
                      viewBox="0 0 72 72"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <rect x="8" y="14" width="56" height="44" rx="8" stroke="currentColor" strokeWidth="2" />
                      <circle cx="26" cy="32" r="6" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 48L24 34L36 44L52 28L64 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M36 58V46M30 52L36 58L42 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="poster-upload-dropzone__title">Change image</p>
                    <p className="poster-upload-dropzone__hint">
                      Drag and drop a new image here, or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="poster-upload-fields-col">
              <div className="poster-upload-field poster-upload-field--primary">
                <label htmlFor="edit-poster-title">Title</label>
                <input
                  id="edit-poster-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>

              <div className="poster-upload-field poster-upload-field--primary">
                <label htmlFor="edit-poster-organizer">Organizer</label>
                <input
                  id="edit-poster-organizer"
                  type="text"
                  value={organizer}
                  onChange={(event) => setOrganizer(event.target.value)}
                  required
                />
              </div>

              <div className="poster-upload-field">
                <label htmlFor="edit-poster-description">Description</label>
                <textarea
                  id="edit-poster-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div className="poster-upload-details-section">
                <span className="poster-upload-section-label">Date and location</span>
                <div className={`poster-upload-details-panel${repeating ? ' poster-upload-details-panel--location-only' : ''}`}>
                  <div className="poster-upload-details-panel__body">
                    {!repeating && (
                      <>
                        <div className="poster-upload-details-panel__col">
                          <div className="poster-upload-icon-row">
                            <img src="/time-icon.svg" alt="" aria-hidden="true" />
                            <div className="poster-upload-icon-row__content poster-upload-schedule-compact">
                              <input
                                id="edit-poster-event-date"
                                type="date"
                                value={singleEventDate}
                                onChange={(event) => setSingleEventDate(event.target.value)}
                                aria-label="Event date"
                              />
                              <p className="poster-upload-schedule-compact__hint">Exact time optional</p>
                              <div className="poster-upload-schedule-compact__times">
                                <input
                                  id="edit-poster-event-time-start"
                                  type="time"
                                  value={singleEventTime}
                                  onChange={(event) => setSingleEventTime(event.target.value)}
                                  aria-label="Start time (optional)"
                                />
                                <span className="poster-upload-schedule-compact__sep" aria-hidden="true">–</span>
                                <input
                                  id="edit-poster-event-time-end"
                                  type="time"
                                  value={singleEventTimeEnd}
                                  onChange={(event) => setSingleEventTimeEnd(event.target.value)}
                                  aria-label="End time (optional)"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="poster-upload-details-panel__divider" aria-hidden="true" />
                      </>
                    )}

                    <div className="poster-upload-details-panel__col poster-upload-details-panel__col--location">
                      <div className="poster-upload-icon-row">
                        <img src="/location-icon.svg" alt="" aria-hidden="true" />
                        <div className="poster-upload-icon-row__content">
                          <LocationSearchInput
                            premadeOptions={PREMADE_LOCATIONS}
                            selectedPremade={selectedPremade}
                            customLocations={customLocations}
                            onChange={handleLocationChange}
                            placeholder="Search locations…"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="poster-upload-field">
                <span className="poster-upload-section-label">Categories</span>
                <div className="poster-upload-pill-group">
                  {POSTER_CATEGORY_OPTIONS.map((cat) => (
                    <label key={cat} className="poster-upload-pill">
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

              <div className="poster-upload-field">
                <span className="poster-upload-section-label">Tags</span>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              <div className="poster-upload-checkbox-row">
                <input
                  id="edit-poster-repeating"
                  type="checkbox"
                  checked={repeating}
                  onChange={(event) => setRepeating(event.target.checked)}
                />
                <label htmlFor="edit-poster-repeating">Repeating event</label>
              </div>

              {repeating && (
                <>
                  <div className="poster-upload-field">
                    <label htmlFor="edit-poster-next-date">Next occurring date</label>
                    <input
                      id="edit-poster-next-date"
                      type="date"
                      value={nextOccurringDate}
                      onChange={(event) => setNextOccurringDate(event.target.value)}
                    />
                  </div>
                  <div className="poster-upload-field">
                    <label htmlFor="edit-poster-frequency">Frequency</label>
                    <select
                      id="edit-poster-frequency"
                      value={frequency}
                      onChange={(event) => setFrequency(event.target.value)}
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Every other week</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="poster-upload-field">
                    <span className="poster-upload-section-label">Days of week</span>
                    <div className="poster-upload-days">
                      {daysOfWeekOptions.map((day) => (
                        <label key={day} className="poster-upload-pill">
                          <input
                            type="checkbox"
                            value={day}
                            checked={daysOfWeek.includes(day)}
                            onChange={handleDayChange}
                          />
                          {day.slice(0, 3)}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <p className="poster-upload-message poster-upload-message--error">{error}</p>}
          {success && (
            <p className="poster-upload-message poster-upload-message--success">
              Poster updated successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditPoster;

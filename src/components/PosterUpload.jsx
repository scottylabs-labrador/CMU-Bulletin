// src/components/PosterUpload.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import MultiSelectDropdown from './MultiSelectDropdown';
import './PosterUpload.css';

const DRAFT_SAVE_DELAY_MS = 700;

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
const daysOfWeekOptions = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function getDraftKey(userId) {
  return `poster-upload-draft-${userId}`;
}

function processImageFile(file, onComplete) {
  if (!file || !file.type.startsWith('image/')) return false;

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

function PosterUpload() {
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
  const [isDragging, setIsDragging] = useState(false);
  const [draftStatus, setDraftStatus] = useState('idle');

  const fileInputRef = useRef(null);
  const skipDraftSaveRef = useRef(true);
  const draftReadyRef = useRef(false);

  const buildDraftPayload = useCallback(() => ({
    title,
    organizer,
    description,
    location,
    otherLocation,
    category,
    image,
    tags,
    repeating,
    singleEventDate,
    singleEventTime,
    singleEventTimeEnd,
    nextOccurringDate,
    frequency,
    daysOfWeek,
    savedAt: Date.now(),
  }), [
    title,
    organizer,
    description,
    location,
    otherLocation,
    category,
    image,
    tags,
    repeating,
    singleEventDate,
    singleEventTime,
    singleEventTimeEnd,
    nextOccurringDate,
    frequency,
    daysOfWeek,
  ]);

  const applyDraft = useCallback((draft) => {
    setTitle(draft.title || '');
    setOrganizer(draft.organizer || '');
    setDescription(draft.description || '');
    setLocation(Array.isArray(draft.location) ? draft.location : []);
    setOtherLocation(draft.otherLocation || '');
    setCategory(Array.isArray(draft.category) ? draft.category : []);
    setImage(draft.image || null);
    setTags(draft.tags || '');
    setRepeating(Boolean(draft.repeating));
    setSingleEventDate(draft.singleEventDate || '');
    setSingleEventTime(draft.singleEventTime || '');
    setSingleEventTimeEnd(draft.singleEventTimeEnd || '');
    setNextOccurringDate(draft.nextOccurringDate || '');
    setFrequency(draft.frequency || '');
    setDaysOfWeek(Array.isArray(draft.daysOfWeek) ? draft.daysOfWeek : []);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      draftReadyRef.current = true;
      return;
    }

    try {
      const raw = localStorage.getItem(getDraftKey(user.uid));
      if (raw) {
        applyDraft(JSON.parse(raw));
        setDraftStatus('saved');
      }
    } catch (err) {
      console.error('Failed to load poster draft:', err);
    }

    draftReadyRef.current = true;
    skipDraftSaveRef.current = true;
  }, [applyDraft]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !draftReadyRef.current) return undefined;

    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return undefined;
    }

    setDraftStatus('saving');

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(getDraftKey(user.uid), JSON.stringify(buildDraftPayload()));
        setDraftStatus('saved');
      } catch (err) {
        console.error('Failed to save poster draft:', err);
        setDraftStatus('idle');
      }
    }, DRAFT_SAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [buildDraftPayload]);

  const handleImageFile = (file) => {
    const accepted = processImageFile(file, setImage);
    if (!accepted) {
      setError('Please upload a valid image file.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleDayChange = (e) => {
    const { value, checked } = e.target;
    setDaysOfWeek((prev) =>
      checked ? [...prev, value] : prev.filter((day) => day !== value)
    );
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setCategory((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  const clearDraft = () => {
    const user = auth.currentUser;
    if (user) {
      localStorage.removeItem(getDraftKey(user.uid));
    }
    setDraftStatus('idle');
  };

  const resetForm = () => {
    setTitle('');
    setOrganizer('');
    setDescription('');
    setLocation([]);
    setCategory([]);
    setImage(null);
    setTags('');
    setRepeating(false);
    setSingleEventDate('');
    setSingleEventTime('');
    setSingleEventTimeEnd('');
    setNextOccurringDate('');
    setFrequency('');
    setDaysOfWeek([]);
    setOtherLocation('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    skipDraftSaveRef.current = true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('You must be logged in to upload a poster.');
      return;
    }
    if (!image) {
      setError('Please select an image.');
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
        finalLocations = finalLocations.filter((loc) => loc !== 'Other');
        finalLocations.push(otherLocation.trim());
      }

      const posterData = {
        title,
        organizer,
        description,
        location: finalLocations,
        category,
        image_url: image,
        uploaded_by: auth.currentUser.uid,
        tags: tags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== ''),
        repeating,
        created_at: Timestamp.now(),
        image_filename: `${title.split(' ')[0] || 'untitled'}.png`,
        sort_date: repeating ? nextOccurringDate : singleEventDate,
      };

      if (repeating) {
        posterData.next_occurring_date = nextOccurringDate;
        posterData.frequency = frequency;
        posterData.days_of_week = daysOfWeek;
        posterData.single_event_date = '';
        posterData.single_event_time = '';
        posterData.single_event_time_end = '';
      } else {
        posterData.single_event_date = singleEventDate;
        if (singleEventTime) {
          posterData.single_event_time = singleEventTime;
        }
        if (singleEventTimeEnd) {
          posterData.single_event_time_end = singleEventTimeEnd;
        }
      }

      await addDoc(collection(db, 'posters'), posterData);

      clearDraft();
      setSuccess(true);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const dropzoneClassName = [
    'poster-upload-dropzone',
    isDragging ? 'poster-upload-dropzone--dragging' : '',
    image ? 'poster-upload-dropzone--has-image' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const draftStatusLabel =
    draftStatus === 'saving' ? 'Saving…' : draftStatus === 'saved' ? 'Changes saved' : '';

  return (
    <div className="page-content poster-upload-page">
      <div className="poster-upload-container">
        <form className="poster-upload-form" onSubmit={handleSubmit}>
          <div className="poster-upload-header">
            <h2>Upload New Poster</h2>
            <div className="poster-upload-header__actions">
              {draftStatusLabel && (
                <span
                  className={`poster-upload-save-status poster-upload-save-status--${draftStatus}`}
                  aria-live="polite"
                >
                  {draftStatusLabel}
                </span>
              )}
              <button type="submit" disabled={uploading} className="poster-upload-submit">
                {uploading ? 'Uploading…' : 'Upload poster'}
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
                aria-label="Upload poster image"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="poster-upload-dropzone__input"
                  onChange={handleImageChange}
                  accept="image/*"
                />
                {image ? (
                  <>
                    <img
                      src={image}
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
                    <p className="poster-upload-dropzone__title">Upload image</p>
                    <p className="poster-upload-dropzone__hint">
                      Drag and drop an image here, or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="poster-upload-fields-col">
              <div className="poster-upload-field poster-upload-field--primary">
                <input
                  id="poster-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  aria-label="Title"
                  required
                />
              </div>

              <div className="poster-upload-field poster-upload-field--primary">
                <input
                  id="poster-organizer"
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Organizer"
                  aria-label="Organizer"
                  required
                />
              </div>

              <div className="poster-upload-field">
                <label htmlFor="poster-description">Description</label>
                <textarea
                  id="poster-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                                id="poster-event-date"
                                type="date"
                                value={singleEventDate}
                                onChange={(e) => setSingleEventDate(e.target.value)}
                                aria-label="Event date"
                              />
                              <p className="poster-upload-schedule-compact__hint">Exact time optional</p>
                              <div className="poster-upload-schedule-compact__times">
                                <input
                                  id="poster-event-time-start"
                                  type="time"
                                  value={singleEventTime}
                                  onChange={(e) => setSingleEventTime(e.target.value)}
                                  aria-label="Start time (optional)"
                                />
                                <span className="poster-upload-schedule-compact__sep" aria-hidden="true">–</span>
                                <input
                                  id="poster-event-time-end"
                                  type="time"
                                  value={singleEventTimeEnd}
                                  onChange={(e) => setSingleEventTimeEnd(e.target.value)}
                                  aria-label="End time (optional)"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="poster-upload-details-panel__divider" aria-hidden="true" />
                      </>
                    )}

                    <div className="poster-upload-details-panel__col">
                      <div className="poster-upload-icon-row">
                        <img src="/location-icon.svg" alt="" aria-hidden="true" />
                        <div className="poster-upload-icon-row__content">
                          <MultiSelectDropdown
                            label="Select location"
                            options={availableLocations}
                            selectedOptions={location}
                            onChange={setLocation}
                          />
                          {location.includes('Other') && (
                            <input
                              id="poster-other-location"
                              type="text"
                              className="poster-upload-details-panel__other"
                              value={otherLocation}
                              onChange={(e) => setOtherLocation(e.target.value)}
                              placeholder="Specify other location"
                              aria-label="Specify other location"
                              required={location.includes('Other')}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="poster-upload-field">
                <span className="poster-upload-section-label">Categories</span>
                <div className="poster-upload-pill-group">
                  {availableCategories.map((cat) => (
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
                <label htmlFor="poster-tags">Tags (comma-separated)</label>
                <input
                  id="poster-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. free food, workshop"
                />
              </div>

              <div className="poster-upload-checkbox-row">
                <input
                  id="poster-repeating"
                  type="checkbox"
                  checked={repeating}
                  onChange={(e) => setRepeating(e.target.checked)}
                />
                <label htmlFor="poster-repeating">Repeating event</label>
              </div>

              {repeating && (
                <>
                  <div className="poster-upload-field">
                    <label htmlFor="poster-next-date">Next occurring date</label>
                    <input
                      id="poster-next-date"
                      type="date"
                      value={nextOccurringDate}
                      onChange={(e) => setNextOccurringDate(e.target.value)}
                    />
                  </div>
                  <div className="poster-upload-field">
                    <label htmlFor="poster-frequency">Frequency</label>
                    <select
                      id="poster-frequency"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
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
              Poster uploaded successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default PosterUpload;

// src/components/Modal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import HeartIcon from './HeartIcon';
import { formatEventDateTime } from '../utils/eventDateTime';

function Modal({ poster, onClose, user, likedPosters, handleLikeToggle, uploaderName }) {
  if (!poster) return null;

  const googleCalUrl = poster.googleCalUrl;

  const toTagList = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const formatTagLabel = (tag) =>
    tag.charAt(0).toUpperCase() + tag.slice(1);

  const categoryPills = toTagList(poster.category).map((cat) => ({
    key: `category-${cat}`,
    label: formatTagLabel(cat),
  }));
  const tagPills = (poster.tags || []).map((tag) => ({
    key: `tag-${tag}`,
    label: tag,
  }));
  const combinedPills = [...categoryPills, ...tagPills];

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing modal */}
        {/* <button className="modal-close-btn" onClick={onClose}>&times;</button> */}
        <button onClick={onClose} className="modal-close-btn">
          <img src="/x.svg"  alt="close button"  />
        </button>
        <div className="modal-body">
          <div className="modal-image-container">
            {user && (
              <button
                type="button"
                className="modal-heart-overlay"
                onClick={() => handleLikeToggle(poster.id)}
                aria-label={likedPosters.includes(poster.id) ? 'Unlike poster' : 'Like poster'}
              >
                <HeartIcon
                  filled={likedPosters.includes(poster.id)}
                  style={{ width: '22px', height: '22px', pointerEvents: 'none' }}
                />
              </button>
            )}
            <img src={poster.image_url} alt={poster.title} />
          </div>
          <div className="modal-details-container">
            <h2>{poster.title}</h2>
            <p className="modal-organizer">{poster.organizer || uploaderName || 'Unknown'}</p>
            {!poster.repeating && poster.single_event_date && (
              <div className="align-icon modal-meta">
              <img src="/time-icon.svg" alt="" />
              <span>{formatEventDateTime(poster.single_event_date, poster.single_event_time, poster.single_event_time_end)}</span>
              </div>
            )}

            <div className="align-icon modal-meta">
              <img src="/location-icon.svg" alt="" />
              <span>{Array.isArray(poster.location) ? poster.location.join(', ') : poster.location}</span>
            </div>

            <p className="modal-description">{poster.description}</p>

            {combinedPills.length > 0 && (
              <div className="modal-tags-section">
                <div className="modal-tag-list">
                  {combinedPills.map((pill) => (
                    <span key={pill.key} className="modal-tag-pill">
                      {pill.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {poster.repeating && (
              <>
                <p><strong>Next Occurring:</strong> {formatEventDateTime(poster.next_occurring_date, poster.event_time)}</p>
                <p><strong>Frequency:</strong> {poster.frequency}</p>
                <p><strong>Days:</strong> {poster.days_of_week.join(', ')}</p>
              </>
            )}

          {googleCalUrl && (
              <div className="modal-calendar-section">
                  <a
                    className="modal-calendar-btn"
                    href={googleCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src="/calendar-icon.svg" alt="" className="modal-calendar-btn__icon" />
                    Add to Google Calendar
                  </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
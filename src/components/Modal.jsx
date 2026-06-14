// src/components/Modal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import HeartIcon from './HeartIcon';

function Modal({ poster, onClose, user, likedPosters, handleLikeToggle, uploaderName }) {
  if (!poster) return null;

  const googleCalUrl = poster.googleCalUrl;

  const toTagList = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const formatTagLabel = (tag) =>
    tag.charAt(0).toUpperCase() + tag.slice(1);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing modal */}
        {/* <button className="modal-close-btn" onClick={onClose}>&times;</button> */}
        <button onClick={onClose} className="modal-close-btn">
          <img src="/x.svg"  alt="close button"  />
        </button>
        {user && (
          <div className="heart-container">
            <HeartIcon
              filled={likedPosters.includes(poster.id)}
              onClick={() => {
                console.log('Heart icon clicked for poster:', poster.id);
                handleLikeToggle(poster.id);
              }}
              style={{
                width: '30px',
                height: '30px',
                zIndex: 100,
              }}
            />
          </div>
        )}
        <div className="modal-body">
          <div className="modal-image-container">
            <img src={poster.image_url} alt={poster.title} />
          </div>
          <div className="modal-details-container">
            <h2>{poster.title}</h2>
            <p><strong>{poster.organizer ? 'Organizer:' : 'Uploaded by:'}</strong> {poster.organizer || uploaderName || 'Unknown'}</p>
            {!poster.repeating && poster.single_event_date && (
              <div className="align-icon modal-meta">
              <img src="/time-icon.svg" alt="" />
              <span>{poster.single_event_date}</span>
              </div>
            )}

            <div className="align-icon modal-meta">
              <img src="/location-icon.svg" alt="" />
              <span>{Array.isArray(poster.location) ? poster.location.join(', ') : poster.location}</span>
            </div>

            <p className="modal-description">{poster.description}</p>

            {toTagList(poster.category).length > 0 && (
              <div className="modal-tags-section">
                <div className="modal-tag-list">
                  {toTagList(poster.category).map((cat) => (
                    <span key={cat} className="modal-tag-pill">
                      {formatTagLabel(cat)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {poster.tags && poster.tags.length > 0 && (
              <div className="modal-tags-section">
                <span className="modal-tags-label">Tags</span>
                <div className="modal-tag-list">
                  {poster.tags.map((tag) => (
                    <span key={tag} className="modal-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {poster.repeating && (
              <>
                <p><strong>Next Occurring:</strong> {poster.next_occurring_date}</p>
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
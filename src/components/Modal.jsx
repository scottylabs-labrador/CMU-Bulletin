// src/components/Modal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import HeartIcon from './HeartIcon';
import { formatEventDateTime } from '../utils/eventDateTime';

function Modal({ poster, onClose, user, likedPosters, handleLikeToggle, uploaderName }) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) {
      window.clearTimeout(copiedTimeoutRef.current);
    }
  }, []);

  if (!poster) return null;

  const googleCalUrl = poster.googleCalUrl;

  const getPosterShareUrl = () => `${window.location.origin}/poster/${poster.id}`;

  const handleShare = async (event) => {
    event.stopPropagation();
    const shareUrl = getPosterShareUrl();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

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
        <div className="modal-header-actions">
          <div className="modal-share-btn-wrap">
            <button
              type="button"
              onClick={handleShare}
              className="modal-share-btn"
              aria-label={copied ? 'Link copied' : 'Copy link to poster'}
            >
              <img src="/share-icon.svg" alt="" />
            </button>
            {copied && (
              <div className="modal-share-toast" role="status" aria-live="polite">
                Link copied!
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close">
            <img src="/x.svg" alt="" />
          </button>
        </div>
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
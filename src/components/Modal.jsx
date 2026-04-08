// src/components/Modal.jsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import HeartIcon from './HeartIcon';

function Modal({ poster, onClose, user, likedPosters, handleLikeToggle, uploaderName }) {
  if (!poster) return null;

  const googleCalUrl = poster.googleCalUrl;

  return (
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
              <div className="align-icon">
              
              <img src='\time-icon.svg'></img>
              <span><strong></strong>    {poster.single_event_date}</span>
              </div>
            )}
           

            <div className="align-icon">
              
              <img src='\location-icon.svg'></img>
              <span><strong></strong> {Array.isArray(poster.location) ? poster.location.join(', ') : poster.location}</span>

            </div>

            <br/>

            <p>{poster.description}</p>
            

            <div>
              {/* <div className="modal-icon">
                <img src='\location-icon.svg'></img>
                <p><strong>Location:</strong> {Array.isArray(poster.location) ? poster.location.join(', ') : poster.location}</p>
              </div> */}

            </div>

            

            
            
            <p><strong>Category:</strong> {Array.isArray(poster.category) ? poster.category.join(', ') : poster.category}</p>
            {poster.tags && poster.tags.length > 0 && (
              <p><strong>Tags:</strong> {poster.tags.join(', ')}</p>
            )}
            {poster.repeating && (
              <>
                <p><strong>Next Occurring:</strong> {poster.next_occurring_date}</p>
                <p><strong>Frequency:</strong> {poster.frequency}</p>
                <p><strong>Days:</strong> {poster.days_of_week.join(', ')}</p>
              </>
            )}

          {googleCalUrl && (
              <div style={{ textAlign: 'center' }}>
                  

                  
                  <p >
                      <a 
                          className="calendar-link"
                          href={googleCalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            display: "inline-block",
                            backgroundColor: "black",
                            color: "white",
                            textDecoration: "none",
                            padding: "10px 20px",
                            borderRadius: "20px"
                          }}
                          // inline styling unoptimal but temporary fix 
                          // until figure out how to override the anchor styling
                         
                       
                      >
                          <div className="align-icon">
              
                            <img src='\calendar-icon.svg'></img>
                            <span><strong></strong> Add to Google Calendar</span>

                          </div>
                          
                      </a>
                  </p>


                  {/* <h4 style={{ marginBottom: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Add to Calendar</h4> */}
                  {/* QR Code */}
                  {/* <QRCodeSVG 
                      value={googleCalUrl}
                      size={100}
                      level="L"
                  /> */}
                  {/* hiding this for now until find way to integrate better visually */}

                  {/* Direct Clickable Link */}
                  
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
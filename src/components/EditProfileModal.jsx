import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, getUserDisplayName, parseUserName } from '../firebase';

const DESCRIPTION_MAX_LENGTH = 160;

function processProfileImage(file, onComplete, onInvalid) {
  if (!file || !file.type.startsWith('image/')) {
    onInvalid?.();
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      onComplete(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function EditProfileModal({ userData, onClose, onSaved }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setName(getUserDisplayName(userData) === 'Unknown' ? '' : getUserDisplayName(userData));
    setDescription(userData?.description || '');
    setProfilePhoto(userData?.profilePhotoUrl || null);
    setRemovePhoto(false);
    setError(null);
  }, [userData]);

  const previewPhoto = removePhoto ? null : profilePhoto;
  const fallbackPhoto = '/tester-pfp-icon.svg';

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processProfileImage(
      file,
      (dataUrl) => {
        setProfilePhoto(dataUrl);
        setRemovePhoto(false);
        setError(null);
      },
      () => setError('Please upload a valid image file.')
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('You must be signed in to update your profile.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const profile = parseUserName(trimmedName);
      const payload = {
        ...profile,
        description: description.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (removePhoto) {
        payload.profilePhotoUrl = null;
      } else if (profilePhoto) {
        payload.profilePhotoUrl = profilePhoto;
      }

      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      await updateProfile(user, { displayName: profile.name });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="profile-edit-overlay" onClick={onClose}>
      <div
        className="profile-edit-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <button type="button" className="profile-edit-modal__close" onClick={onClose} aria-label="Close">
          <img src="/x.svg" alt="" />
        </button>

        <h2 id="profile-edit-title" className="profile-edit-modal__title">Edit profile</h2>

        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <div className="profile-edit-photo">
            <button
              type="button"
              className="profile-edit-photo__preview-wrap"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile picture"
            >
              <img
                src={previewPhoto || fallbackPhoto}
                alt=""
                className={`profile-edit-photo__preview${previewPhoto ? ' profile-edit-photo__preview--custom' : ''}`}
              />
              <span className="profile-edit-photo__change">Change photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-edit-photo__input"
              onChange={handlePhotoChange}
            />
            {(previewPhoto || userData?.profilePhotoUrl) && !removePhoto && (
              <button
                type="button"
                className="profile-edit-photo__remove"
                onClick={() => {
                  setRemovePhoto(true);
                  setProfilePhoto(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Remove photo
              </button>
            )}
          </div>

          <div className="profile-edit-field">
            <label htmlFor="profile-edit-name">Name</label>
            <input
              id="profile-edit-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="profile-edit-field">
            <label htmlFor="profile-edit-description">
              Description <span className="profile-edit-field__optional">(optional)</span>
            </label>
            <textarea
              id="profile-edit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
              placeholder="A short bio about you or your organization"
              rows={3}
            />
            <span className="profile-edit-field__count">
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>

          {error && <p className="profile-edit-form__error">{error}</p>}

          <div className="profile-edit-form__actions">
            <button type="button" className="profile-edit-form__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="profile-edit-form__save" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditProfileModal;

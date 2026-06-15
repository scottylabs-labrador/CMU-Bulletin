import React, { useState } from 'react';

function TagInput({ tags, onChange, placeholder = 'Type a tag and press Enter' }) {
  const [query, setQuery] = useState('');

  const addTag = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const alreadyAdded = tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase());
    if (alreadyAdded) {
      setQuery('');
      return;
    }

    onChange([...tags, trimmed]);
    setQuery('');
  };

  const removeTag = (tag) => {
    onChange(tags.filter((item) => item !== tag));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag(query);
      return;
    }

    if (event.key === 'Backspace' && !query && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="poster-upload-tag-input">
      {tags.length > 0 && (
        <div className="poster-upload-tag-input__selected">
          {tags.map((tag) => (
            <span key={tag} className="poster-upload-tag-input__pill">
              {tag}
              <button
                type="button"
                className="poster-upload-tag-input__pill-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        className="poster-upload-tag-input__input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length > 0 ? 'Add another tag…' : placeholder}
        aria-label="Tags"
        autoComplete="off"
      />
    </div>
  );
}

export default TagInput;

import { useState } from 'react';

function UserDropDown() {
  // 1. Initialize state (default is false/hidden)
  const [isVisible, setIsVisible] = useState(false);

  // 2. The toggle logic
  const toggleVisibility = () => {
    setIsVisible(!isVisible); // "!" means "the opposite of what it is now"
  };

  return (
    <div>
      <button onClick={toggleVisibility}>
        {isVisible ? 'Hide Message' : 'Show Message'}
      </button>

      {/* 3. Conditional Rendering */}
      {isVisible && <p>Surprise! I was hidden. 🎉</p>}
    </div>
  );
}
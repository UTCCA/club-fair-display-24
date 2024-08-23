import React, { useState } from 'react';
import './App.css';

function Switch() {
  const [isOn, setIsOn] = useState(false);
  const offText = "WASD controls"
  const onText = "Custom controller"

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  return (
    <div className="switch-container">
      <div className={`switch ${isOn ? 'on' : 'off'}`} onClick={toggleSwitch}>
        <div className="switch-handle"></div>
      </div>
      <p className="switch-text">{isOn ? onText : offText}</p>
    </div>
  );
}

export default Switch;


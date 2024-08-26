import './App.css';
import Terrain from './terrain-improvised';
import Switch from './switch';
import React, { useState, useCallback } from 'react';

function App() {

  const [controllerState, setControllerState] = useState(null);
  
  const [isOn, setIsOn] = useState(false);
  const toggleSwitch = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);

  return (
    <div className="App">
      <div className="switch-container">
        <Switch isOn={isOn} toggleSwitch={toggleSwitch} />
      </div>

      <div className="terrain-container">
        <Terrain usingWASDControls={isOn} controllerState={controllerState}/>
      </div>
    </div>
  );
}

export default App;

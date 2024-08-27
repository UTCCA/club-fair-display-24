import './App.css';

function Switch({isOn, toggleSwitch}) {
  const offText = "Controller"
  const onText = "KBM"

  return (
    <div className="switch-container">
      <div className={`switch ${isOn ? 'on' : 'off'}`} onClick={toggleSwitch}>
        <div className="switch-handle"></div>
      </div>
      <p className="switch-text" id="sw-txt-id">{isOn ? onText : offText}</p>
    </div>
  );
}

export default Switch;


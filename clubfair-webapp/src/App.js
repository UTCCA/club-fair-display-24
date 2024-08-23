import './App.css';
import Terrain from './terrain';
import Switch from './switch';


function App() {
  return (
    <div className="App">
      <div class="switch-container">
        <Switch />
      </div>

      <div class="terrain-container">
        <Terrain />
      </div>
    </div>
  );
}

export default App;

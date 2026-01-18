import { useState } from "react";
import Header from "./components/Header/Header";
import VideoPlayer from "./components/VideoPlayer/VideoPlayer";
import Morphogenesis from "./components/Morphogenesis";
import Dispersion from "./components/Dispersion";
import SelectionScreen from "./components/SelectionScreen";

type Screen = "landing" | "selection" | "morphogenesis" | "dispersion";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");

  const handleEnterClick = () => {
    setCurrentScreen("selection");
  };

  const handleSelectArtwork = (artwork: "morphogenesis" | "dispersion") => {
    setCurrentScreen(artwork);
  };

  const handleBack = () => {
    setCurrentScreen("selection");
  };

  return (
    <div className="w-[100vw] max-w-1500 overflow-hidden flex justify-center items-center h-[100dvh]">
      {currentScreen === "landing" && (
        <>
          <Header onClick={handleEnterClick} />
          <VideoPlayer />
        </>
      )}
      {currentScreen === "selection" && (
        <SelectionScreen onSelect={handleSelectArtwork} />
      )}
      {currentScreen === "morphogenesis" && (
        <Morphogenesis onBack={handleBack} />
      )}
      {currentScreen === "dispersion" && (
        <Dispersion onBack={handleBack} />
      )}
    </div>
  );
}

export default App;

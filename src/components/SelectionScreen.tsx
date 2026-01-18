import React from "react";
import ButtonComponent from "./Button/ButtonComponent";
import "./SelectionScreen.css";

interface SelectionScreenProps {
  onSelect: (artwork: "morphogenesis" | "dispersion") => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect }) => {
  return (
    <div className="selection-container">
      <div className="selection-header">
        <div className="selection-title">
          View <span className="text-[#ADD8E6]">Artwork</span>.
        </div>
        <div className="selection-underline"></div>
      </div>

      <div className="cards-container">
        <div className="artwork-card" onClick={() => onSelect("morphogenesis")}>
          <h2 className="card-title">Morphogenesis</h2>
          <p className="card-description">
            An exploration of organic growth patterns through cellular automata. Watch and interact as clusters grow and evolve on the canvas.
          </p>
          <div className="card-button">
            <ButtonComponent
              onClick={() => onSelect("morphogenesis")}
              buttonText="Open"
            />
          </div>
        </div>

        <div className="artwork-card" onClick={() => onSelect("dispersion")}>
          <h2 className="card-title">Dispersion</h2>
          <p className="card-description">
           An attempt to model the phenomenon of dispersion. Using a mouse controlled animation. (Best experienced on Desktop)
          </p>
          <div className="card-button">
            <ButtonComponent
              onClick={() => onSelect("dispersion")}
              buttonText="Open"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionScreen;

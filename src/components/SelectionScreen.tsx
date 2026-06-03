import React from "react";
import ArtworkCard, { Artwork, InternalScreen } from "./ArtworkCard";
import "./SelectionScreen.css";

interface SelectionScreenProps {
  onSelect: (artwork: InternalScreen) => void;
}


const artworks: Artwork[] = [
  {
    kind: "internal",
    title: "Morphogenesis",
    description:
      "An exploration of organic growth patterns through cellular automata. Watch and interact as clusters grow and evolve on the canvas.",
    screen: "morphogenesis",
  },
  {
    kind: "internal",
    title: "Dispersion",
    description:
      "An attempt to model the phenomenon of dispersion. Using a mouse controlled animation. (Best experienced on Desktop)",
    screen: "dispersion",
  },
  {
    kind: "external",
    title: "Agua",
    description: "Agua is an immersive audio-visual experience that translates the fluid and dynamic nature of water into a digital canvas.",
    url: "https://aguasofresh.vercel.app/",
  },
];

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
        {artworks.map((artwork) => (
          <ArtworkCard
            key={artwork.title}
            artwork={artwork}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectionScreen;

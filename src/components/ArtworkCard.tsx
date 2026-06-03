import React from "react";
import ButtonComponent from "./Button/ButtonComponent";

export type InternalScreen = "morphogenesis" | "dispersion" | "agua";

/**
 * An artwork is either:
 *  - "internal": its component lives in this codebase and we open it by
 *    switching screens via onSelect.
 *  - "external": the project is already live elsewhere, so a click navigates
 *    the browser to its URL instead of mounting a local component.
 */
export type Artwork =
  | {
      kind: "internal";
      title: string;
      description: string;
      buttonText?: string;
      screen: InternalScreen;
    }
  | {
      kind: "external";
      title: string;
      description: string;
      buttonText?: string;
      url: string;
    };

interface ArtworkCardProps {
  artwork: Artwork;
  onSelect: (screen: InternalScreen) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onSelect }) => {
  const handleOpen = () => {
    if (artwork.kind === "external") {
      // Live project — navigate the current tab to it.
      window.location.href = artwork.url;
    } else {
      onSelect(artwork.screen);
    }
  };

  return (
    <div className="artwork-card" onClick={handleOpen}>
      <h2 className="card-title">{artwork.title}</h2>
      <p className="card-description">{artwork.description}</p>
      <div className="card-button">
        <ButtonComponent
          onClick={handleOpen}
          buttonText={artwork.buttonText ?? "Open"}
        />
      </div>
    </div>
  );
};

export default ArtworkCard;

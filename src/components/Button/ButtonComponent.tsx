import React, { useState } from "react";
import { Button } from "@mantine/core";

interface ButtonComponentProps {
  onEnterClick: () => void;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({ onEnterClick }) => {
  const [buttonText, setButtonText] = useState("Enter");

  const handleClick = () => {
    if (buttonText === "Enter") {
      onEnterClick();
    } else {
      setButtonText("Enter");
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="md"
      variant="gradient"
      gradient={{ from: "indigo", to: "cyan" }}
    >
      {buttonText}
    </Button>
  );
};

export default ButtonComponent;

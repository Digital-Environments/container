import React, { useState } from "react";
import { Button } from "@mantine/core";

interface ButtonComponentProps {
  onEnterClick?: () => void;
  onClick?: () => void;
  buttonText?: string
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({
  onEnterClick,
  onClick,
  buttonText,
}) => {
  

  // const handleClick = () => {
  //   if (buttonText === "Enter") {
  //     onEnterClick();
  //   } else {
  //     setButtonText("Enter");
  //   }
  // };

  return (
    <Button
      onClick={onClick}
      size="md"
      variant="gradient"
      gradient={{ from: "indigo", to: "cyan" }}
    >
      {buttonText}
    </Button>
  );
};

export default ButtonComponent;

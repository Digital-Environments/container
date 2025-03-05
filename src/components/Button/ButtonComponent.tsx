import React from "react";
import { Button } from "@mantine/core";

interface ButtonComponentProps {
  onEnterClick?: () => void;
  onClick?: () => void;
  buttonText?: string
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({
  onClick,
  buttonText,
}) => {
  

  return (
    <Button
      onClick={onClick}
      size="md"
      className="!w-[95px]"
      variant="gradient"
      gradient={{ from: "indigo", to: "cyan" }}
    >
      {buttonText}
    </Button>
  );
};

export default ButtonComponent;

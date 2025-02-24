import React from "react";
import './header.css'
import ButtonComponent from "../Button/ButtonComponent";

interface HeaderProps {
  onEnterClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onEnterClick }) => {
  return (
    <div className="header  lg:min-w-[400px] w-full">
      <div className="header-label text-[48px] lg:text-[72px] text-white">
        Digital <span className="text-[#ADD8E6]">Environments</span>.
      </div>
      <div className="underline w-[240px] lg:min-w-[350px]"></div>
      <ButtonComponent onEnterClick={onEnterClick} />
    </div>
  );
};

export default Header;
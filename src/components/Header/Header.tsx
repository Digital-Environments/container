import React from "react";
import './header.css'
import ButtonComponent from "../Button/ButtonComponent";

const Header = () => {

    return (
      <div className="header  overflow-hidden">
        <div className="header-label text-lg text-white">
          Digital <span className="text-[#ADD8E6]">Environments</span>.
        </div>
        <div className="underline"></div>
        <ButtonComponent />
      </div>
    );
}

export default Header;
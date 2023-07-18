import React from "react";
import './header.css'
import ButtonComponent from "../Button/ButtonComponent";

const Header = () => {

    return (
        <div className="header">
            <div className="header-label" style={{color: "white"}}>
                Digital <span style={{color: "#ADD8E6"}}>Environments</span>.
            </div>
            <div className="underline"></div>
            <ButtonComponent />
        </div>
    )
}

export default Header;
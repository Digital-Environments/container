import React, {useEffect, useState} from "react";
import { Button } from '@mantine/core';


const ButtonComponent = () => {

    const [buttonText, setButtonText] = useState("Enter");

    const handleClick = () => {
        buttonText === "Enter" ? setButtonText("Jokes, feature coming soon!") : setButtonText("Enter")
}

    return (
        <Button onClick={handleClick} size="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
            {buttonText}                         
        </Button>
    )
}

export default ButtonComponent;
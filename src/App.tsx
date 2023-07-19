import {useEffect} from "react";

import Header from "./components/Header/Header";
import VideoPlayer from "./components/VideoPlayer/VideoPlayer";

import styled from 'styled-components';
import AboutUs from "./components/AboutUs/AboutUs";

const Section = styled.div`
display: flex;
justify-content: center;
align-content: center;
flex-wrap: wrap;
flex-direction: column;
`


function App() {

  useEffect(() => {
    fetch("https://api.chucknorris.io/jokes/random")
    .then((response) => response.json())
    .then((joke) => {
      console.log(joke.value);
    });
}, [])

  return (
    <Section>
      <Header />
      <VideoPlayer />  
      <AboutUs />
    </Section>
  );
}

export default App;

import React, {useEffect} from "react";

import Header from "./components/Header/Header";
import VideoPlayer from "./components/VideoPlayer/VideoPlayer";

function App() {

  useEffect(() => {
    fetch("https://api.chucknorris.io/jokes/random")
    .then((response) => response.json())
    .then((joke) => {
      console.log(joke.value);
    });
}, [])

  return (
    <div className="App">
        <>
          <Header />
         <VideoPlayer />
        </>  
    </div>
  );
}

export default App;

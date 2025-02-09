import './videoplayer.css'
import video from '../../assets/video_asset.mp4'
import styled from 'styled-components'

const Section = styled.div`
    position: fixed;
    right: 0;
    bottom: 0;
    height: 100vh;
    min-width: 100%;
    min-height: 100%;
    z-index: -1;
`

const VideoPlayer = () => {

return (
  <Section>
    <video autoPlay muted playsInline className="video">
      <source src={video} type="video/mp4" />
    </video>
  </Section>
);
}
export default VideoPlayer;
import './videoplayer.css'
import video from '../../assets/video_asset.mp4'

const VideoPlayer = () => {

return (
<video autoPlay muted loop className='video'>
<source src={video} type="video/mp4" />
</video>
)
}

export default VideoPlayer;
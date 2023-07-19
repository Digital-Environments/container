import styled from 'styled-components';
import { Button } from '@mantine/core';

const AboutUsContainer = styled.section`
min-width: 320px;
height: 100vh;
color: #f5f5f5;
padding: 2px;
display: flex;
flex-direction: column;
align-items: center;
position: relative;
`

const AboutUsHeader = styled.h1`
font-size: 3.5rem;
width: 600px;
font-family: 'Montserrat', sans-serif;
text-align: start;
::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
}

text-transform: uppercase;
`;

const AboutUsContentContainer = styled.div`
    display: flex;
    padding: 8px;
    gap: 16px;
    margin-bottom: 32px;

`;


const AboutUsContent = styled.div`
margin: 24px;
font-size: 1rem;
text-align: center;
max-height: 300px;
width: 500px;
padding: 0;
`;

const AboutUs = () => {
  return (
    <AboutUsContainer>
        <AboutUsHeader>We provide digital <span style={{color: "#ADD8E6"}}>experiences</span>.</AboutUsHeader>
        <AboutUsContentContainer>
        <AboutUsContent>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut tincidunt lectus ut consequat molestie. 
        Etiam rutrum orci cursus dapibus aliquam. Integer sed purus orci. Nullam lectus orci, venenatis at ornare a, tincidunt id magna. 
        Etiam ut volutpat ipsum. Nam at bibendum lacus. In sed lacus luctus, pulvinar ex non, porta nunc. 
        Ut posuere massa non nisl ultrices volutpat. 
        Curabitur viverra id justo eget sagittis. Aenean et lacus eu ex tristique finibus. Nam suscipit dapibus euismod. In ultricies luctus interdum. Vestibulum rutrum lectus arcu.
        Aliquam leo mauris, dignissim a massa non, tempus dignissim libero. Nam turpis risus, lacinia id nunc vel, tempor lobortis leo.
        </AboutUsContent>
        <AboutUsContent>
        Fusce sed dignissim urna, at placerat enim. Ut eget vestibulum tellus, vitae volutpat ligula. 
        Maecenas rutrum nec libero vitae dictum. Vivamus sagittis nisi felis.
        Mauris tempor, lorem sed tempor mollis, augue lorem pharetra diam, sed eleifend tellus dui ac ligula. Cras vel tincidunt mauris. Nunc auctor urna et laoreet dapibus.
        Morbi dignissim vitae ligula in viverra.
        </AboutUsContent>
        </AboutUsContentContainer>
        <Button size="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
            Continue
        </Button>
    </AboutUsContainer>
  )
}

export default AboutUs
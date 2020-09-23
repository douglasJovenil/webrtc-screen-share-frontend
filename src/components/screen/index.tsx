import React, {VideoHTMLAttributes} from 'react';
import { Container } from './styles';

type IScreenProps = VideoHTMLAttributes<HTMLVideoElement>;

const Screen: React.FC<IScreenProps> = ({...rest}) => (
  <Container {...rest}>
  </Container>
);

export default Screen;
import React, {ButtonHTMLAttributes} from 'react';
import { Container } from './styles';

type IButton = ButtonHTMLAttributes<HTMLButtonElement>;

const Button: React.FC<IButton> = ({children, ...rest}) => (
  <Container {...rest}>
    <p>{children}</p>
  </Container>
);

export default Button;

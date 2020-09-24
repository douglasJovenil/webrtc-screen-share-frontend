import React from 'react';
import { Container, MainContent } from './styles';

import ErrorIcon from 'src/assets/error-icon';

const ErrorPage: React.FC = () => (
  <Container>
    <MainContent>
      <ErrorIcon />
    </MainContent>
  </Container>
);

export default ErrorPage;

import React from 'react';
import { Container } from './styles';

import { FaUserCircle } from 'react-icons/fa';

interface IViewerCard {
  label: string;
  colorIcon: string
}

const ViewerCard: React.FC<IViewerCard> = ({ label, colorIcon }) => (
  <Container colorIcon={colorIcon}>
    <FaUserCircle />
    <label>{label}</label>
  </Container>
);

export default ViewerCard;

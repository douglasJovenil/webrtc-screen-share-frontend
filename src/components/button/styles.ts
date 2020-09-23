import styled from 'styled-components';

export const Container = styled.button`

  background-color: rgba(21, 21, 21, 0.9);
  color: rgba(255, 255, 255, 1);

  font-size: 1rem;

  padding: 0.55rem 1.2rem;
  width: 16rem;
  text-align: center;
  border: 0;
  border-radius: 0.2rem;

  transition: all 0.25s ease-in-out;

  cursor: pointer;
  &:hover {
    background-color: rgba(21, 21, 21, 0.7);
  }

  &:disabled {
    background-color: rgba(21, 21, 21, 0.2);
  }
`;

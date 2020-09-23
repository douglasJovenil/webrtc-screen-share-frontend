import styled from 'styled-components';

interface IContainer {
  colorIcon: string;
}

export const Container = styled.div<IContainer>`
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100%;

  padding: 2.5rem 0;

  border-bottom: 0.05rem solid rgba(42, 42, 42, 0.05);

  > svg {
    margin-bottom: 0.8rem;
    font-size: 3rem;
    color: ${(props) => props.colorIcon};
  }
`;

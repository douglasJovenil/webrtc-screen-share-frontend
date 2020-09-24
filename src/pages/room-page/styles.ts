import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  height: 100vh;
  width: 100vw;

  .hide {
    display: none;
  }
`;

export const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  width: 100%;
  height: 100%;

  padding: 1.5rem;
`;

export const VideoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 90%;

  > video {
    width: 100%;
    height: 100%;
  }
`;

export const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export const LateralContent = styled.div`
  display: flex;
  flex-direction: column;

  /* width: 21rem; */
  width: 25%;
  height: 100%;

  box-shadow: 0px 0px 6px 1px rgba(42, 42, 42, 0.2);
`;

export const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
`;


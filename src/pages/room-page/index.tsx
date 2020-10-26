import React, { useEffect, useState, useRef } from 'react';
import { useBeforeUnload, useVideo } from 'react-use';
import Peer, { SignalData } from 'simple-peer';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';

import {
  Container,
  MainContent,
  LateralContent,
  VideoContainer,
  SpinnerContainer,
  ButtonsContainer,
} from './styles';

import ViewerCard from 'src/components/viewer-card';
import Button from 'src/components/button';
import Loader from 'react-loader-spinner';

interface AnswerPayload {
  signal: SignalData;
  socketID: string;
}

const RoomPage: React.FC = () => {
  const [viewersSocketsIDs, setViewersSocketsIDs] = useState<string[]>([]);
  const [streamerSocketID, setStreamerSocketID] = useState<string>('');
  const [video, , , videoRef] = useVideo(<video autoPlay muted />);

  const socket = useRef<SocketIOClient.Socket>();
  const stream = useRef<MediaStream>();
  const peers = useRef<Map<string, Peer.Instance>>(
    new Map<string, Peer.Instance>()
  );

  const history = useHistory();

  useEffect(() => {
    socket.current = io.connect(
      process.env.NODE_ENV === 'production'
        ? 'webrtc-screen-share-backend.herokuapp.com'
        : 'localhost:8080'
    );

    // ALL: solicitacao para entrar na sala
    socket.current.emit('join_room');

    // VIEWER: quando a sala estiver cheia -> Redireciona para tela de erro
    socket.current.on('full_room', () => {
      history.push('/error');
    });

    // VIEWER: quando alguem entra na sala pela PRIMEIRA vez -> Quem acabou de entrar recebe todos os integrantes da sala para atualizar a UI
    socket.current.on(
      'send_who_is_in_the_room',
      (receivedSocketsIDs: string[]) => {
        setViewersSocketsIDs(receivedSocketsIDs);
      }
    );

    // STREAMER: quando o streamer vai iniciar a stream -> Recebe os IDs dos viewers para criar um peer para cada
    socket.current.on(
      'create_viewers_peers',
      async (receivedSocketsIDs: string[]) => {
        try {
          const mediaDevices = navigator.mediaDevices as any;
          stream.current = await mediaDevices.getDisplayMedia();
        } catch {
          if (socket.current) socket.current.emit('stop_stream');
          return;
        }

        // Callback para quando o streamer parar de compartilhar -> Ocorre quando for clicado no botao que aparece no pop-up do navegador
        if (stream.current)
          stream.current.getVideoTracks().forEach((track) => {
            track.onended = stopStream;
          });

        // Mostra na tela do streamer sua propria captura de tela
        setMainVideo();

        // Cria um peer para cada viewer
        receivedSocketsIDs.forEach((socketID) => {
          peers.current.set(socketID, createOfferPeer(socketID));
        });
      }
    );

    // VIEWER: quando o streamer solicita que o viewer crie um peer -> Necessario para dar continuidade no handshake
    socket.current.on('create_answer', (offer: SignalData) => {
      createAnswerPeer(offer);
    });

    // STREAMER: quando o streamer recebe a resposta da conexao WebRTC dos viewers -> Necessario para finalizar o handshake e comecar a transmissao
    socket.current.on('accept_answer', (answer: AnswerPayload) => {
      const peer: Peer.Instance | undefined = peers.current.get(
        answer.socketID
      );
      if (peer) peer.signal(answer.signal);
    });

    // ALL: quando o streamer inicia a transmissao -> Informa os integrantes para atualizar a UI
    socket.current.on('send_streamer', (socketID: string) => {
      setStreamerSocketID(socketID);
    });

    // STREAMER: solicitacao para adicionar um novo viewer -> Ocorre quando a stream ja estiver acontecendo
    socket.current.on('add_new_peer', (socketID: string) => {
      peers.current.set(socketID, createOfferPeer(socketID));
    });

    // STREAMER: quando algum viewer sai da sala -> Deleta o peer do viewer que saiu. Esse metodo nao atualiza a UI, ela sera atualizada posteriormente pelo topico send_who_quit
    socket.current.on('delete_peer', (socketID: string) => {
      peers.current.delete(socketID);
    });

    // ALL: quando alguem entra na sala e a stream ja comecou -> Os integrantes da sala com excecao de quem acabou de entrar recebe o ID de quem entrou para atualizar a UI
    socket.current.on('send_who_joined', (socketID: string) => {
      setViewersSocketsIDs((previousViewers) => [...previousViewers, socketID]);
    });

    // ALL: quando alguem sai da sala -> Os integrantes recebem o ID de quem saiu para atualizar a UI
    socket.current.on('send_who_quit', (socketID: string) => {
      setViewersSocketsIDs((previousViewers) =>
        previousViewers.filter((id) => id !== socketID)
      );
    });
  }, []);

  // ALL: Handler para fechar a aba -> Caso o streamer feche a aba, os viewers devem ser informados
  useBeforeUnload(() => {
    if (socket.current) {
      if (iAmTheStreamer()) socket.current.emit('stop_stream');
      socket.current.disconnect();
    }
    return true;
  });

  // STREAMER: cria um peer usando a captura de tela do streamer
  function createOfferPeer(socketID: string) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream.current,
    });

    // Callback para enviar a iniciar a conexao WebRTC -> Envia para o servidor
    peer.on('signal', (signal: SignalData) => {
      if (socket.current)
        socket.current.emit('send_offer', { signal, socketID });
    });

    peer.on('error', () => console.log(`viewer ${socketID} desconectou`));

    return peer;
  }

  // VIEWER: cria o peer que vai receber a stream
  function createAnswerPeer(offer: SignalData) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });

    // Quando receber a resposta da conexao WebRTC -> Envia para o servidor
    peer.on('signal', (answer: SignalData) => {
      if (socket.current) socket.current.emit('send_answer', answer);
    });

    // Quando receber a stream -> Mostra na tela
    peer.on('stream', (streamReceived: MediaStream) => {
      stream.current = streamReceived;
      setMainVideo();
    });

    // Quando o peer for fechado -> Limpa as tracks da stream para evitar que o elemento video do HTML fique com fundo preto
    peer.on('close', () => {
      cleanStreamTracks();
    });

    // Quando o streamer parar a transmissao
    peer.on('error', () => {
      console.log('streamer parou a transmissao');
    });

    // Gera a resposta para disparar a callback de signal -> Esse peer nao precisa ser salvo pois ao enviar a resposta pro streamer o handshake sera finalizado
    peer.signal(offer);
  }

  // ALL: Indica que o integrante em questao gostaria de compartilhar sua tela -> Esse integrante passara a ser o streamer, todos os participantes da sala serao notificados
  function startStream() {
    if (socket.current) socket.current.emit('start_stream');
  }

  // STREAMER: Limpa os peers, as tracks da stream e notifica os viewers da sala que parou de compartilhar a tela
  function stopStream() {
    if (peers.current.size > 0) {
      peers.current.forEach((peer) => peer.destroy());
      peers.current.clear();
    }
    cleanStreamTracks();
    if (socket.current) socket.current.emit('stop_stream');
  }

  // ALL: limpa as tracks da stream para evitar que o pop-up do google fique aberto e que o elemento HTML de video fique com fundo preto
  function cleanStreamTracks() {
    if (stream.current) {
      const currentStream = stream.current;
      currentStream.getVideoTracks().forEach((track) => {
        currentStream.removeTrack(track);
        track.stop();
      });
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }

  // ALL: seta a source do video com a stream
  function setMainVideo() {
    // Configura a stream do elemento video
    if (videoRef.current && stream.current)
      videoRef.current.srcObject = stream.current;
  }

  // ALL: verifica se existe um streamer na sala
  function roomHasStreamer(): boolean {
    return streamerSocketID === undefined || streamerSocketID === ''
      ? false
      : true;
  }

  // ALL: verifica se o usuario em questao eh o streamer
  function iAmTheStreamer(): boolean {
    const socketID = getSocketID();
    return socketID !== '' && streamerSocketID === socketID;
  }

  // ALL: Retorna o proprio socketID
  function getSocketID(): string {
    if (socket.current) {
      return socket.current.id ? socket.current.id : '';
    }
    return '';
  }

  // ALL: Retorna se o socket esta conectado
  function isSocketConnected(): boolean {
    return getSocketID().length > 1 ? true : false;
  }

  // ALL: Retorna se a cliente em questao possui uma stream ativa
  function hasStream(): boolean {
    if (stream.current) return stream.current.active;
    return false;
  }

  return (
    <Container>
      <MainContent>
        <VideoContainer
          className={(!roomHasStreamer() || !hasStream()) ? 'hide' : ''}
        >
          {video}
        </VideoContainer>

        {(!roomHasStreamer() || !hasStream()) && (
          <SpinnerContainer>
            <Loader type="Circles" color="#212121" />
          </SpinnerContainer>
        )}

        <ButtonsContainer>
          {iAmTheStreamer() && (
            <Button onClick={() => stopStream()} disabled={!roomHasStreamer()}>
              Parar de Compartilhar
            </Button>
          )}

          {!iAmTheStreamer() && (
            <Button
              onClick={() => startStream()}
              disabled={roomHasStreamer() || !isSocketConnected()}
            >
              Compartilhar tela
            </Button>
          )}
        </ButtonsContainer>
      </MainContent>

      <LateralContent>
        {isSocketConnected() && (
          <ViewerCard
            label={getSocketID()}
            colorIcon={iAmTheStreamer() ? '#FF1744' : '#2979FF'}
          />
        )}

        {viewersSocketsIDs.map((name) => (
          <ViewerCard
            key={name}
            label={name}
            colorIcon={streamerSocketID === name ? '#FF1744' : '#424242'}
          />
        ))}
      </LateralContent>
    </Container>
  );
};

export default RoomPage;

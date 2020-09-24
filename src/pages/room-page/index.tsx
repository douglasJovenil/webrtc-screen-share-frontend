import React, { useEffect, useState, useRef } from 'react';
import useBeforeUnload from 'use-before-unload';
import Peer, { SignalData } from 'simple-peer';
import io from 'socket.io-client';

import {
  Container,
  MainContent,
  LateralContent,
  VideoContainer,
  SpinnerContainer,
  Row,
} from './styles';

import ViewerCard from 'src/components/viewer-card';
import Screen from 'src/components/screen';
import Button from 'src/components/button';
import Loader from 'react-loader-spinner';
import { useHistory } from 'react-router-dom';

interface AnswerPayload {
  signal: SignalData;
  socketID: string;
}

const RoomPage: React.FC = () => {
  const [viewersSocketsIDs, setViewersSocketsIDs] = useState<string[]>([]);
  const [streamerSocketID, setStreamerSocketID] = useState<string>('');

  const socket = useRef<SocketIOClient.Socket>();
  const stream = useRef<MediaStream>();
  const peers = useRef<Map<string, Peer.Instance>>(
    new Map<string, Peer.Instance>()
  );

  const history = useHistory();

  useEffect(() => {
    socket.current = io.connect(
      process.env.NODE_ENV === 'production'
        ? 'feracode-backend.herokuapp.com'
        : 'localhost:8080'
    );
    // Cliente solicita ao servidor pedindo para entrar na sala
    socket.current.emit('join_room');
    // STREAMER: quando o streamer vai iniciar a stream
    // Deve ser criado um peer para cada viwer
    socket.current.on(
      'create_peers_to_start_stream',
      async (receivedSocketsIDs: string[]) => {
        try {
          // Aquisicao da captura de tela
          const mediaDevices = navigator.mediaDevices as any;
          stream.current = await mediaDevices.getDisplayMedia();
        } catch {
          stopStream();
          return;
        }

        // Callback para quando o streamer para de compartilhar a tela
        stream.current.getVideoTracks().forEach((track) => {
          track.onended = stopStream;
        });

        // Mostra na tela do streamer sua propria captura de tela
        setMainVideo();

        // Para cada viwer conectado na sala um peer eh criado e salvo em peers
        receivedSocketsIDs.forEach((socketID) => {
          peers.current.set(socketID, createOfferPeer(socketID));
        });
      }
    );

    // STREAMER: solicitacao para adicionar um novo viewer
    // quando a streamer ja estiver acontecendo
    socket.current.on('add_new_peer', (socketID: string) => {
      peers.current.set(socketID, createOfferPeer(socketID));
    });

    // STREAMER: quando o streamer recebe a resposta dos viewers
    socket.current.on('accept_answer', (answer: AnswerPayload) => {
      // Procura pelo peer do viewer especifico para finalizar o handshake
      peers.current.get(answer.socketID).signal(answer.signal);
    });

    // STREAMER: quando algum viewer sai da sala
    socket.current.on('delete_peer', (socketID: string) => {
      // Deleta o peer do viewer que saiu
      peers.current.delete(socketID);
    });

    // VIEWER: quando o streamer solicita que o viewer crie um peer
    socket.current.on('create_answer', (offer: SignalData) => {
      createAnswerPeer(offer);
    });

    // VIEWER: quando alguem entra na sala, recebe todos os integrantes da sala
    socket.current.on(
      'send_viewers_of_room',
      (receivedSocketsIDs: string[]) => {
        setViewersSocketsIDs(receivedSocketsIDs);
      }
    );

    // VIEWER: quando alguem entra na sala
    socket.current.on('viewer_joined', (socketID: string) => {
      setViewersSocketsIDs((previousViewers) => [...previousViewers, socketID]);
    });

    // VIEWER: quando alguem sai da sala
    // todos recebem os ID de quem saiu para atualizar a UI
    socket.current.on('viewer_quit', (socketID: string) => {
      setViewersSocketsIDs((previousViewers) =>
        previousViewers.filter((id) => id !== socketID)
      );
    });

    // VIEWER: quando alguem comeca uma stream
    // informa os viewers para atualizar a UI
    socket.current.on('streamer_joined', (socketID: string) => {
      setStreamerSocketID(socketID);
    });

    // VIEWER: quando a sala estiver cheia
    socket.current.on('full_room', () => {
      history.push('/error');
    });
  }, []);

  // Chamado ao fechar a aba
  useBeforeUnload(() => {
    // Desconecta o socket do usuario em questao
    socket.current.disconnect();
  });

  function createOfferPeer(socketID: string) {
    // cria um peer usando a captura de tela do streamer
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream.current,
    });

    // callback para enviar a offer para o servidor
    peer.on('signal', (signal: SignalData) => {
      socket.current.emit('send_offer', { signal, socketID });
    });

    peer.on('error', () => console.log(`viewer ${socketID} desconectou`));

    return peer;
  }

  function createAnswerPeer(offer: SignalData) {
    // Cria o peer dos viewers, esse peer nao precisa ser salvo
    // precisa apenas enviar a resposta para o streamer
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });

    // Envia a resposta para o servidor
    peer.on('signal', (answer: SignalData) => {
      socket.current.emit('send_answer', answer);
    });

    // Quando receber uma stream, mostra na tela o que esta recebendo
    peer.on('stream', (streamReceived: MediaStream) => {
      stream.current = streamReceived;
      setMainVideo();
    });

    peer.on('close', () => {
      cleanStreamTracks();
    });

    // Quando o streamer parar a transmissao
    peer.on('error', () => {
      console.log('streamer parou a transmissao');
    });

    // Gera a resposta
    peer.signal(offer);
  }

  function startStream() {
    // Indica que o usuario em questao gostaria de compartilhar sua tela
    socket.current.emit('start_stream');
  }

  function stopStream() {
    // Limpa os peers
    peers.current.forEach((peer) => peer.destroy());
    peers.current.clear();
    cleanStreamTracks();
    // Informa o servidor que o streamer parou de compartilhar a tela
    socket.current.emit('stop_stream');
  }

  function cleanStreamTracks() {
    stream.current.getVideoTracks().forEach((track) => {
      stream.current.removeTrack(track);
      track.stop();
    });

  }

  function setMainVideo() {
    // Configura a stream do elemento video
    const mainVideo = document.getElementById('main-video') as HTMLVideoElement;
    mainVideo.srcObject = stream.current;
  }

  function roomHasStreamer(): boolean {
    return streamerSocketID === null || streamerSocketID === '' ? false : true;
  }

  function iAmTheStreamer(): boolean {
    const socketID = getSocketID();
    return socketID !== '' && streamerSocketID === socketID;
  }

  function getSocketID(): string {
    if (socket.current) {
      return socket.current.id;
    }
    return '';
  }

  return (
    <Container>
      <MainContent>
        {roomHasStreamer() && (
          <VideoContainer>
            <Screen id="main-video" autoPlay muted />
          </VideoContainer>
        )}

        {!roomHasStreamer() && (
          <SpinnerContainer>
            <Loader type="Circles" color="#212121" height={100} width={100} />
          </SpinnerContainer>
        )}

        <Row>
          {iAmTheStreamer() && (
            <Button onClick={() => stopStream()} disabled={!roomHasStreamer()}>
              Parar de Compartilhar
            </Button>
          )}

          {!iAmTheStreamer() && (
            <Button onClick={() => startStream()} disabled={roomHasStreamer()}>
              Compartilhar tela
            </Button>
          )}
        </Row>
      </MainContent>

      <LateralContent>
        <ViewerCard
          label={getSocketID()}
          colorIcon={iAmTheStreamer() ? '#FF1744' : '#2979FF'}
        />
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

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
  socketId: string;
}

const RoomPage: React.FC = () => {
  const [viewersName, setViewersName] = useState<string[]>([]);
  const [streamerName, setStreamerName] = useState<string>('');
  const [myName, setMyName] = useState<string>('');

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
      async (receivedSocketsIds: string[]) => {
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
        setMainVideo(stream.current);

        // Para cada viwer conectado na sala um peer eh criado e salvo em peers
        receivedSocketsIds.forEach((socketId) => {
          peers.current.set(socketId, createOfferPeer(socketId));
        });
      }
    );

    // STREAMER: solicitacao para adicionar um novo viewer
    // quando a streamer ja estiver acontecendo
    socket.current.on('add_new_peer', (socketId: string) => {
      peers.current.set(socketId, createOfferPeer(socketId));
    });

    // STREAMER: quando o streamer recebe a resposta dos viewers
    socket.current.on('accept_answer', (answer: AnswerPayload) => {
      // Procura pelo peer do viewer especifico para finalizar o handshake
      peers.current.get(answer.socketId).signal(answer.signal);
    });

    // STREAMER: quando algum viewer sai da sala
    socket.current.on('delete_peer', (socketId: string) => {
      // Deleta o peer do viewer que saiu
      peers.current.delete(socketId);
    });

    // VIEWER: quando o streamer solicita que o viewer crie um peer
    socket.current.on('create_answer', (offer: SignalData) => {
      createAnswerPeer(offer);
    });

    // VIEWER: quando alguem entra na sala, recebe todos os integrantes da sala
    socket.current.on(
      'send_viewers_of_room',
      (receivedSocketsIds: string[]) => {
        setViewersName(receivedSocketsIds);
      }
    );

    // VIEWER: quando alguem entra na sala
    socket.current.on('viewer_joined', (socketId: string) => {
      setViewersName((previousViewers) => [...previousViewers, socketId]);
    });

    // VIEWER: quando alguem sai da sala
    // todos recebem os ID de quem saiu para atualizar a UI
    socket.current.on('viewer_quit', (socketId: string) => {
      setViewersName((previousViewers) =>
        previousViewers.filter((id) => id !== socketId)
      );
    });

    // VIEWER | STREAMER: quando o viewer consegue entrar na sala
    // recebe seu ID para mostrar na UI
    socket.current.on('join_accept', (socketId: string) => setMyName(socketId));

    // VIEWER: quando alguem comeca uma stream
    // informa os viewers para atualizar a UI
    socket.current.on('streamer_joined', (socketId: string) => {
      setStreamerName(socketId);
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

  function createOfferPeer(socketId: string) {
    // cria um peer usando a captura de tela do streamer
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream.current,
    });

    // callback para enviar a offer para o servidor
    peer.on('signal', (signal: SignalData) => {
      socket.current.emit('send_offer', { signal, socketId });
    });

    peer.on('error', () => console.log(`viewer ${socketId} desconectou`));

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
    peer.on('stream', (stream: MediaStream) => {
      setMainVideo(stream);
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

    stream.current.getVideoTracks().forEach((track) => {
      stream.current.removeTrack(track);
      track.stop();
    });

    // Informa o servidor que o streamer parou de compartilhar a tela
    socket.current.emit('stop_stream');
  }

  function setMainVideo(stream: MediaStream) {
    // Configura a stream do elemento video
    const mainVideo = document.getElementById('main-video') as HTMLVideoElement;
    mainVideo.srcObject = stream;
  }

  function roomHasStreamer(): boolean {
    return streamerName === null || streamerName === '' ? false : true;
  }

  function iAmTheStreamer(): boolean {
    return myName !== '' && myName !== '' && streamerName === myName;
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
          label={myName}
          colorIcon={iAmTheStreamer() ? '#FF1744' : '#2979FF'}
        />
        {viewersName.map((name) => (
          <ViewerCard
            key={name}
            label={name}
            colorIcon={streamerName === name ? '#FF1744' : '#424242'}
          />
        ))}
      </LateralContent>
    </Container>
  );
};

export default RoomPage;

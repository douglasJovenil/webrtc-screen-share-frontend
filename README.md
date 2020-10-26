# WebRTC Screen Share Front-End

Simple screen sharing application using WebRTC technology. The current version supports up to four people in the room, one streamer and three viewers. Only one person can stream at a time (if someone else wants to stream they have to wait for the streamer to finish the transmission so it is made available again).

## ☁️ Links
- [Live Preview](https://webrtc-screen-share-frontend.herokuapp.com)
- [Back-End code](https://github.com/douglasJovenil/webrtc-screen-share-backend)

## 💻 Project

#### User alone in the room

<p align="center">
   <img src="./img/00_usuario_sozinho_na_sala.png">
</p>

#### Two users in the room

<p align="center">
   <img src="./img/01_dois_usuario_na_sala.png">
</p>

#### User starting a stream

<p align="center">
   <img src="./img/02_usuario_iniciando_stream.png">
</p>

#### Viewer screen while streamer select a streaming source

<p align="center">
   <img src="./img/04_tela_do_viewer_quando_o_streamer_esta_selecionando_uma_fonte.png">
</p>

#### Streamer screen during the stream

<p align="center">
   <img src="./img/05_tela_do_streamer_durante_stream.png">
</p>

#### Viewer screen during the stream

<p align="center">
   <img src="./img/06_tela_do_viewer_durante_stream.png">
</p>

## 🚀 Technologies

This project was developed with the following technologies:

<img align="left" alt="Typescript" width="26px" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/typescript/typescript.png" /> Typescript

<img align="left" alt="ReactJS" width="26px" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/react/react.png" /> ReactJS

<img align="left" alt="styled-components" width="26px" src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/styled-components/styled-components.png" /> Styled-Components

<img align="left" alt="WebRTC" width="26px" src="https://i.imgur.com/9C5ScMM.png" > WebRTC

<img align="left" alt="SocketIO" width="26px" src="https://upload.wikimedia.org/wikipedia/commons/9/96/Socket-io.svg" /> SocketIO

## 🏃 Usage

```bash
git clone https://github.com/douglasJovenil/webrtc-screen-share-frontend
cd feracode_frontend
yarn install
yarn start
```

## 📔 TODO
- Fix bug that occurs when a user try to join the room and the streamer finishes the stream
- Configure environment variables to use at Heroku
- Configure CORS

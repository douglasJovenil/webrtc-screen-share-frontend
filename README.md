# Feracode Frontend

Crie uma aplicação simples em WebRTC para o compartilhamento de tela aonde multiplas pessoas possam compartilhar e assistir o compartilhamento de tela em uma mesma chamada. O compartilhamento não pode ser somente p2p, é necessário que pelo menos 3 pessoas possam se connectar e ver a tela sendo compartilhada, os mesmos 3 usuarios devem poder compartilhar suas telas também (não é necessario que todos compartilhem simultaneamente, somente que os 3 tenham a opção de compartilhar suas telas). Para submiter seu teste, envie-nos o link para aplicação e acesso ao repositório (o código deve ser de sua autoria). Indicamos a utilização da versão gratuita do heroku para realizar o teste, porém fica a seu critério utilizar seu próprio servidor ou qualquer outro assim como uma url propria ou a gratuita do heroku ou qualquer outro serviço. Os links podem ser enviados por aqui mesmo.


arrumar origin no backend

acontece erro quando alguem esta entrando na sala e o streamer quita

backend

trocar a var para const


join_room -> solicitacao para entrar na sala
add_new_peer -> solicita que o stremaer adicione um peer | se tiver steramer
streamer_joined -> informa que entrou sobre quem é o streamer | se tiver streamer
full_room -> Informa que a sala esta cheia
send_viewers_of_room -> Informar os integrantes da sala
create_viewers_peers -> Informa pro streamer criar os peers
create_answer -> Informa o viewer que deve criar uma resposta para conexão WebRTC
accept_answer -> Envia a resposta do viewer para o streamer
delete_peer -> Informa que o streamer delete o peer que saiu
viewer_joined -> Informa os integrantes que alguem entrou na sala
viewer_quit -> Informa os integrantes que alguem saiu da sala
stop_stream -> O streamer informa que parou a transmissao
send_offer -> O streamer envia o signal da conexão WebRTC
send_answer -> O viewer envia o signal da conexão WebRTC
start_stream -> O integrante informa que vai iniciar a stream

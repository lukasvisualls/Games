# JARVIS Games

Canal público de jogos sob demanda para o JARVIS. O aplicativo contém as capas; os pacotes são baixados pela aba **JARVIS GAMES** e executados dentro do aplicativo.

Os pacotes oficiais ficam em **Releases**. `catalog-v2.json` informa versão, tamanho e SHA-256 de cada pacote para clientes atuais; `catalog.json` preserva compatibilidade com clientes anteriores. O JARVIS confere tamanho e integridade antes de instalar.

## Jogos

Battle Royale, Tetris, Flappy Bird, Agar.io, Minecraft 3D, Nitro Rush 3D, Neon Breaker e Rhythia. Counter-Strike 1.6 e Super Tux Kart ficam como capas **Em breve** no JARVIS 2.1.140, sem abertura. Arquivos já instalados do CS são preservados.

## Nitro Rush 1.1.0 — dois amigos

Requer JARVIS 2.1.140 nas duas pontas e o pacote atualizado em Games. Na conversa de Amigos, use o controle **Jogar Nitro Rush com amigo**, escolha o amigo online e envie o convite. O amigo aceita no próprio JARVIS. O PC de quem convida hospeda a corrida de dois pilotos em Interlagos (média); sair encerra a sala. Há também **Jogar com amigo** no cartão Nitro Rush.

Física, colisões, coleta e classificação são sincronizadas pelo anfitrião via WebRTC. Os saves individuais permanecem locais; somente resumos de progresso e sinalização autenticada usam Supabase. Redes restritas podem exigir TURN; nenhum serviço pago de relay foi configurado. Não há promessa de funcionamento em toda rede. Outros títulos não se tornam multiplayer com esse pacote.

## Controles corrigidos

- Battle Royale: WASD; Espaço para saltar do ônibus; mova o mouse para olhar livremente, sem segurar botão.
- Tetris: A/D para mover, Z para girar, S para descer e Espaço para soltar.
- Flappy Bird: Espaço ou clique para voar; música e efeitos originais com controle de som.
- Agar.io: mouse para guiar; música ambiente original com controle de som.
- Minecraft: WASD, Espaço para pular. Continuar restaura o mundo e Novo mundo reinicia após confirmação. Mova o mouse para olhar livremente, sem segurar botão.

## Dados pessoais

Este repositório não recebe partidas, moedas, credenciais, mapas pessoais ou dados de usuários. O progresso permanece na pasta de dados do JARVIS no computador. Baixar ou atualizar um pacote não apaga os saves.

## Créditos

As fontes e atribuições estão em `PROVENANCE.md` e nos READMEs de cada jogo. Os avisos MIT dos motores gráficos foram preservados. Não atribuímos licença própria ao código de terceiros que não declare licença. Rhythia é distribuído como runtime nativo na release, sem mapas ou configuração do usuário.


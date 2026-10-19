# JARVIS Games

Canal público de jogos sob demanda para o JARVIS. O aplicativo contém as capas; os pacotes são baixados pela aba **JARVIS GAMES** e executados dentro do aplicativo.

Os pacotes oficiais ficam em **Releases**. `catalog-v3.json` atende JARVIS 2.1.143 ou superior, com SuperTuxKart e VoxeLibre nativos e Nitro 1.1.1. `catalog-v2.json` e `catalog.json` preservam clientes anteriores sem anunciar pacotes incompatíveis. O JARVIS confere tamanho e SHA-256 antes de instalar.

## Jogos

Battle Royale, Tetris, Flappy Bird, Agar.io, Minecraft 3D, Nitro Rush 3D, Neon Breaker, Rhythia, SuperTuxKart 1.5 e VoxeLibre 0.92.3 (motor Luanti 5.17.0). Counter-Strike 1.6 permanece **Em breve** e seus arquivos são preservados.

## Nitro Rush 1.1.1 — dois amigos, resposta local

Requer JARVIS 2.1.143 nas duas pontas e o pacote 1.1.1 atualizado em Games. Na conversa de Amigos, use o controle **Jogar Nitro Rush com amigo**, escolha o amigo online e envie o convite. O amigo aceita no próprio JARVIS. O PC de quem convida hospeda a corrida de dois pilotos em Interlagos (média); sair encerra a sala. Há também **Jogar com amigo** no cartão Nitro Rush.

Controle com resposta local no convidado, reconciliação limitada, suavização visual e transporte sem acumular/retransmitir amostras vencidas. Convites, reset e progresso permanecem confiáveis. Testado com atraso e perda artificial, sem prometer latência zero ou desempenho igual em toda máquina.

## Nativos portáteis

As pastas `games/tux-kart` e `games/voxelibre` contêm avisos, versões/hashes de origem e capa. `scripts/prepare-native.mjs` prepara a distribuição x64 a partir das versões oficiais fixadas. Runtime gerado em `native-runtime/` e ZIPs em `packages/` são ignorados pelo Git e distribuídos em Releases, junto dos fontes correspondentes. Não incluem saves de usuários. Os programas originais não foram modificados; a integração ocorre pelo launcher do JARVIS.

SuperTuxKart reaproveita a capa anterior. A capa VoxeLibre foi criada para o catálogo com image_gen; prompt e origem em `games/voxelibre/COVER-ART.md`. São jogos próprios: esta integração não adiciona convite Jarvis/Amigos a eles. Opções de rede dos jogos originais permanecem disponíveis por seus próprios menus.

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


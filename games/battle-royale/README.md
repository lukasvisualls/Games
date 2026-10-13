# 🎮 Battle Royale JS

Um battle royale 3D jogável inspirado no **Fortnite**, feito do zero com **HTML, JavaScript e Three.js** — ônibus de batalha, construção, tempestade, baús e Vitória Royale!

Criado por **[Vitor Menoli](https://www.youtube.com/@vitor.menoli)** 🎬

* * *

## 🎥 Vídeo

Assista como esse jogo foi criado do ZERO usando IA:

👉 **[Recriei o FORTNITE com IA do ZERO — YouTube](https://youtu.be/IPK-PiO2KHU?si=fJcnk-gRPfQ9CfXy)**

* * *

## 🕹️ Jogar Online

👉 **[Clique aqui para jogar no navegador](https://vitormenoli.github.io/Fortnite/)**

* * *

## 🤖 Feito 100% com Claude Code

Este projeto foi desenvolvido inteiramente com o **[Claude Code](https://claude.com/claude-code)**, a IA de programação da Anthropic. Nenhuma linha de código foi escrita manualmente — tudo através de prompts! 🤯

* * *

## ✨ Funcionalidades

- 🚌 **Ônibus de Batalha** — a partida começa num ônibus voador com balão cruzando o mapa; pule quando quiser!
- 🪂 **Paraquedas** — queda livre com mergulho + paraquedas que abre sozinho perto do chão, igual ao Fortnite
- 🗺️ **Mundo 3D de 800m** — terreno com colinas, 5 montanhas com neve no topo e mar ao redor da ilha
- 🏙️ **5 Cidades** — prédios com janelas procedurais (algumas acesas!), carros e praças para explorar
- ⛈️ **Tempestade (Safe)** — 5 zonas que encolhem cada vez mais rápido; a última fecha o mapa POR COMPLETO
- 🧱 **Sistema de Construção** — parede, rampa, chão e pirâmide, tudo alinhado numa grade 3D (dá pra subir rampa e fazer torre!)
- ⛏️ **Farm de Materiais** — quebre árvores 🌲, pedras 🪨, carros 🚗 e até prédios inteiros para ganhar madeira, pedra e ferro
- 🔫 **7 Armas** — Pistola, SMG, Fuzil, Sniper, Escopeta (8 balins!), Revólver e Metralhadora, cada uma com modelo 3D próprio
- 💎 **5 Raridades** — Comum, Incomum, Raro, Épico e Lendário, com cores clássicas e feixe de luz no loot
- 🎁 **Baús Dourados** — brilham, pulsam e abrem com a tampa levantando, soltando loot com sorte extra
- 🛡️ **Escudo Azul** — Mini Escudo (+25 até 50) e Escudo Grande (+50 até 100), com barra própria igual ao jogo real
- 🩹 **Curas** — Bandagem e Kit Médico com barra de canalização
- 🎒 **Inventário de 5 Slots** — aperte TAB e arraste os itens com o mouse para reordenar
- 🤖 **8 Bots com IA** — níveis variados (ruins a médios), pulam do ônibus, fogem da tempestade, atiram e alguns até constroem!
- 🎯 **Mira Precisa por Raycast** — o tiro sai exatamente para onde a cruz aponta, com mira diferente para cada arma (scope na Sniper!)
- 🔊 **Sons 100% Procedurais** — vento, pássaros, tiros, tempestade e até música de lobby, tudo gerado em tempo real com WebAudio
- ⌨️ **Teclas Configuráveis** — remapeie pulo, agachar, construções, picareta e mapa no menu (salvo no navegador)
- 🗺️ **Minimapa + Mapa Grande (M)** — veja cidades, montanhas, baús, ônibus e as safes em tempo real
- 💀 **Killfeed e Colocação** — acompanhe as eliminações e veja em que posição você terminou
- 🏆 **Vitória Royale** — seja o último sobrevivente!

* * *

## 🗂️ Estrutura do Projeto

```
📁 Battle Royale JS
├── index.html    → página, HUD e menu
├── style.css     → visual do HUD, menu e inventário
├── game.js       → loop principal, câmera, projéteis e ônibus
├── world.js      → terreno, montanhas, cidades e objetos quebráveis
├── zone.js       → a tempestade que encolhe em 5 fases
├── build.js      → construção em grade (parede/rampa/chão/pirâmide)
├── weapons.js    → armas, raridades, curas, escudos e baús
├── player.js     → jogador, boneco 3D, paraquedas e inventário
├── bots.js       → bots com IA de níveis variados
├── audio.js      → todos os sons, gerados com WebAudio
└── menu.js       → menu inicial, teclas e volume
```

* * *

## 🚀 Como Rodar Localmente

1. Baixe ou clone este repositório
2. Dê dois cliques no `index.html` (precisa de internet na primeira vez, para carregar o Three.js)
3. Clique em **▶ JOGAR** e boa sorte na ilha! 🏝️

* * *

## 🎮 Controles

| Ação | Tecla |
| --- | --- |
| Mover | `W` `A` `S` `D` |
| Mirar / Atirar / Picaretar | `Mouse` / `Clique esquerdo` |
| Pular / Sair do ônibus / Paraquedas | `Espaço` * |
| Agachar | `Shift` * |
| Parede | `Q` * |
| Rampa | `Botão lateral 1 do mouse` * |
| Chão/Piso | `Botão lateral 2 do mouse` * |
| Pirâmide | `C` * |
| Picareta | `G` * |
| Mapa grande | `M` * |
| Pegar item / Abrir baú | `E` |
| Trocar de slot | `1` a `5` |
| Inventário | `TAB` |
| Reiniciar partida | `R` |

_* Teclas configuráveis no menu inicial_

* * *

Desenvolvido com ❤️ e [Claude Code](https://claude.com/claude-code)

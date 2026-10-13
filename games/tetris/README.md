# 🧱 Tetris com IA

Tetris feito do zero com HTML, CSS e JavaScript puro — sem frameworks, sem bibliotecas externas.

> Criado para o canal **[@vitor.menoli](https://www.youtube.com/@vitor.menoli)** no YouTube.

---

## 🎥 Vídeo

📺 **Assista como foi feito:**
[Clique aqui para ver o vídeo](https://youtu.be/GZFXaLSalq8?si=IoCn6qYmm-BuTDQy)

---

## 🕹️ Jogar Online

🌐 **Jogue agora no seu navegador:**
[Clique aqui para jogar](https://vitormenoli.github.io/Tetris/)

---

## 🤖 Feito 100% com Claude Code

Este jogo foi desenvolvido **inteiramente utilizando [Claude Code](https://claude.ai/code)**, a CLI oficial da Anthropic — sem escrever uma linha de código manualmente.

O processo foi documentado em vídeo no canal para mostrar como a IA pode ser usada como ferramenta de desenvolvimento real.

---

## ✨ Funcionalidades

- 🎮 As 7 peças clássicas (I, O, T, S, Z, J, L) com rotação e cores neon
- 👻 Peça fantasma (ghost) mostrando onde a peça vai pousar
- 🎚️ 4 níveis de dificuldade: Fácil, Médio, Difícil e Impossível
- 🙈 Modo Impossível esconde o preview da próxima peça
- 🏆 Recorde salvo por dificuldade (localStorage)
- 📈 Sistema de pontuação e nível progressivo (peças aceleram a cada 10 linhas)
- 📱 Responsivo — layout adaptado para desktop e mobile, sem scroll no celular
- 🕹️ Controles touch: botões na tela + gestos (arrastar e tocar no tabuleiro)
- 🎵 Música de fundo e efeitos sonoros gerados via Web Audio API
- 🔊 Configurações de áudio (música, efeitos e volume) salvas no navegador
- 🖥️ Tabuleiro escalável — ocupa quase toda a tela em monitores grandes

---

## 🗂️ Estrutura do Projeto

```
tetris/
├── index.html
├── style.css
└── js/
    ├── piece.js   # As 7 peças e suas rotações
    ├── board.js   # Grade, colisão e limpeza de linhas
    ├── audio.js   # Música e efeitos sonoros (Web Audio API)
    └── game.js    # Loop principal, estados, HUD e controles
```

---

## 🚀 Como Rodar Localmente

1. Clone ou baixe o repositório
2. Abra o arquivo `index.html` no navegador
3. Ou use uma extensão como **Live Server** no VS Code

Não precisa instalar nada.

---

## 🎮 Controles

| Ação | Desktop | Mobile |
|------|---------|--------|
| Mover | `←` `→` | Botões ou arrastar |
| Girar | `↑` ou `Z` | Botão ou toque no tabuleiro |
| Descida suave | `↓` | Botão ou arrastar para baixo |
| Drop instantâneo | `Espaço` | Botão ou arrastar rápido |

---

*Desenvolvido com ❤️ e [Claude Code](https://claude.ai/code)*

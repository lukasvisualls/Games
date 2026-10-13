# ⛏️ MineCraft JS

Um clone jogável do Minecraft feito do zero com HTML, JavaScript e **Three.js** — mundo em voxels com cavernas, minérios, água e lava, 12 biomas, vilas com aldeões, fome, armadura, craft com bancada e fornalha, tudo rodando no navegador em um único arquivo.

> Criado para o canal **[@vitor.menoli](https://www.youtube.com/@vitor.menoli)** no YouTube.

---

## 🎥 Vídeos

📺 **Parte 1 — Recriei o Minecraft com IA do zero:** [Assistir no YouTube](https://youtu.be/deoL6mt9Uak?si=b-gN8AiUj9CjqqFU)

🎬 **Parte 2 — Cavernas, minérios, vilas e craft:** [Ver no canal @vitor.menoli](https://www.youtube.com/@vitor.menoli)

---

## 🕹️ Jogar Online

🌐 **Jogue agora no seu navegador:** [Clique aqui para jogar](https://vitormenoli.github.io/Minecraft/)

---

## 🤖 Feito 100% com Claude Code

Este jogo foi desenvolvido **inteiramente utilizando [Claude Code](https://claude.ai/code)**, a CLI oficial da Anthropic — sem escrever uma linha de código manualmente.

O processo foi documentado em vídeo no canal para mostrar como a IA pode ser usada como ferramenta de desenvolvimento real.

---

## ✨ Funcionalidades

### 🌍 Mundo e biomas

- **Mundo infinito por chunks** (16×16×64), gerado proceduralmente e carregado conforme você anda, com as edições persistindo em memória
- **12 biomas** escolhidos por temperatura e umidade, como no original: planície, floresta, floresta de bétulas, selva, pântano, savana, deserto, mesa (*badlands*), taiga, tundra de neve, **campos de cogumelo** e oceano — mais **praias** de areia na beira d'água
- **Grama verde é o bioma predominante** (~60% do mundo), com neve e deserto na medida certa
- **Nível do mar em y=20**: oceanos de verdade, ilhas, litorais e fundo de areia/cascalho
- Cada bioma com sua vegetação: carvalho, bétula, pinheiro, árvore de selva, cacto, arbusto seco, flores, cogumelos e **cogumelos gigantes** nas ilhas de micélio
- **Seed aleatória a cada partida** — mundo e ponto de spawn diferentes toda vez

### 🕳️ Cavernas e minérios

- **Cavernas geradas com ruído 3D** — túneis estilo "espaguete" que se cruzam, abrindo em cavernões nas profundidades (≈10% do subsolo é escavado)
- **Mar de lava no fundo do mundo** e poças de lava espalhadas pelas cavernas
- **4 minérios** com faixas de altura e raridade proporcionais ao jogo original: carvão, ferro, ouro e diamante
- **Monstros nascem nas cavernas a qualquer hora do dia** — e hostis só pegam fogo quando estão a céu aberto

### 💧 Água e lava

- **Nadar**, afundar, subir com `Espaço` e descer com `Shift`; queda na água não machuca
- **Barra de ar com bolhas**: 15 segundos de fôlego e dano de afogamento depois disso
- **Lava queima** (4 de dano a cada meio segundo) e tinge a tela de laranja
- **Balde** para pegar e jogar água ou lava
- **Água + lava reagem como no original**: água caindo **por cima** da lava vira **obsidiana**; encostando **de lado**, vira **pedregulho** — com vapor e chiado

### 🏘️ Vilas e aldeões

- **Vilas geradas no mundo** (uma a cada ~660 blocos) em planície, floresta, savana, taiga e deserto
- Poço central, 5 a 9 casas com fundação, paredes, janelas de vidro, porta, telhado e tocha, ligadas por **caminhos de cascalho**
- Vila de deserto é construída em **arenito**; árvores não nascem dentro da vila, então ela fica numa clareira de verdade
- **Aldeões** perambulando pela vila — clique com o direito para **trocar 3 diamantes por uma peça de armadura de diamante**

### 🍗 Fome e vida

- **Barra de fome idêntica à do Minecraft** (10 coxinhas / 20 pontos), com saturação escondida e exaustão
- Correr, pular, minerar, atacar e apanhar gastam exaustão — os mesmos números do jogo original
- **A vida se regenera consumindo a fome** (6 de exaustão por coração curado); com a fome zerada você **passa fome** e perde vida até meio coração
- **Comer segurando o botão direito** por 1,6s, com som de mastigar, migalhas e a mão tremendo perto da boca
- **Carne podre** dá o efeito Fome: a barra fica verde e treme
- Os corações tremem quando a vida está baixa

### 🎒 Inventário e armadura

- **`Tab` abre o inventário grande**: 40 espaços (10 na barra rápida + 3 linhas), pilhas de até 64
- **Boneco do jogador em 3D girando**, com a armadura aparecendo vestida nele
- **4 espaços de armadura** (capacete, peitoral, calças, botas) que só aceitam a peça certa
- Clique para pegar a pilha, clique de novo para soltar, juntar ou trocar
- **Pontos de armadura do original**: ferro 15, diamante 20 — cada ponto corta 4% do dano, até o teto de 80%, gastando durabilidade a cada golpe
- Fome e afogamento furam a armadura, como no jogo

### 🔨 Craft, bancada e fornalha

- **43 receitas** com os desenhos do Minecraft original, com forma e sem forma
- **Grade 2x2 no inventário** e **3x3 clicando com o direito numa bancada** (Shift + direito coloca bloco em cima dela)
- O desenho **vale em qualquer canto da grade**, igual ao original
- **Aba de crafts rápidos**: mostra o desenho em miniatura com os ícones reais, a seta e o item que sai — **clicou, craftou**, puxando material de qualquer lugar do inventário. As que faltam material ficam apagadas e dizem o que está faltando
- **Fornalha** com entrada, combustível, resultado, barra de chama e barra de progresso — e o bloco troca de textura quando acende
- Funde minério bruto em barra, areia em vidro, pedregulho em pedra, tronco em carvão e **as carnes em assadas** (que enchem bem mais a fome)
- **Ferramentas em 4 níveis** — madeira, pedra, ferro e diamante — com picareta, espada, machado e pá, usando a durabilidade e o dano do original
- **Regra de colheita do Minecraft**: ouro e diamante só caem com picareta de ferro pra cima, ferro só com a de pedra — com aviso na tela quando a ferramenta é fraca demais
- Itens famosos craftáveis: tábuas, gravetos, tochas, bancada, fornalha, balde, TNT, **armaduras de ferro e diamante** e os **blocos maciços** de ferro, ouro, diamante e carvão (com o caminho de volta)

### ⚔️ Jogo

- **Primeira pessoa fiel ao original**: braço do Steve visível, balanço de câmera, item na mão trocando conforme o slot
- **Quebra de blocos com tempo real** e rachaduras progressivas em 4 estágios
- **Colocação de blocos** com raycast voxel (DDA) preciso, inclusive dentro d'água
- **Ciclo de dia e noite** completo — sol, lua, estrelas e céu mudando de cor
- **Mobs**: porcos, vacas e galinhas de dia; zumbis, esqueletos (atiram flechas) e aranhas à noite e nas cavernas — com IA de perseguição e animação
- **TNT explosivo**: acenda com o isqueiro, gera cratera, dano em área e reação em cadeia
- **Modo Criativo**: voo (2x Espaço), blocos e ferramentas infinitos, quebra instantânea, vida infinita
- Tela de morte com **renascimento no local exato da morte** (e nunca dentro da lava)
- Menu de pausa (`Esc`) com modo de jogo e volume, salvos no navegador
- Música ambiente e efeitos sonoros gerados via **Web Audio API**
- **Texturas em pixel art geradas 100% por código** (nenhum arquivo de imagem externo)
- Painel de debug **F3** com posição, bioma, hora, FPS, chunks, mobs, fome, armadura e distância da vila mais próxima

---

## 🧭 Progressão da Sobrevivência

Você começa com ferramentas de madeira e uma bancada. O caminho fecha como no original:

```
árvore → tábuas → gravetos → bancada → ferramentas de pedra
      → minério de ferro → fornalha → barras de ferro
      → picareta de ferro → ouro e diamante
      → armadura e ferramentas de diamante
```

---

## 🗂️ Estrutura do Projeto

```
minecraft-js/
└── index.html   # Jogo completo: HTML, CSS e JavaScript (Three.js via CDN)
```

---

## 🚀 Como Rodar Localmente

1. Clone ou baixe o repositório
2. Abra o arquivo `index.html` no navegador
3. Ou use uma extensão como **Live Server** no VS Code

Não precisa instalar nada — o Three.js é carregado via CDN.

---

## 🎮 Controles

| Ação | Tecla |
|------|-------|
| Mover | `W` `A` `S` `D` |
| Olhar em volta | Mouse |
| Pular / Nadar para cima | `Espaço` |
| Correr | `2x W` |
| Agachar / Afundar na água | `Shift` |
| Voar (Criativo) | `2x Espaço` — `Espaço` sobe / `Shift` desce |
| Quebrar bloco / Atacar | Clique esquerdo (segurar) |
| Colocar bloco / Usar item | Clique direito |
| Comer | Clique direito **segurado** com carne na mão |
| Abrir bancada / fornalha / trocar com aldeão | Clique direito no bloco ou no aldeão |
| Colocar bloco em cima da bancada | `Shift` + clique direito |
| **Inventário, armadura e craft** | `Tab` |
| Selecionar item | `1`-`0` ou Scroll do mouse |
| Pausar / Configurações | `Esc` |
| Painel de debug | `F3` |

---

_Desenvolvido com ❤️ e [Claude Code](https://claude.ai/code)_

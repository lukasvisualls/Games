# Novos jogos do JARVIS — 2.1.113

Integrações locais dos projetos de Vitor Menoli:

- Battle Royale: https://github.com/vitormenoli/Fortnite
- Tetris: https://github.com/vitormenoli/Tetris
- Flappy Bird: https://github.com/vitormenoli/Flappy-Bird
- Agar.io: https://github.com/vitormenoli/Agario-Claude-Code
- Minecraft 3D: https://github.com/vitormenoli/Minecraft

Os READMEs originais foram preservados em cada pasta. Os projetos não declaram licença de código; esta adaptação não modifica essa condição nem concede direitos sobre os originais. As versões Three.js 0.149.0 e 0.160.0 preservam as licenças MIT nos diretórios engine.

## Persistência

Ponte compartilhada `/games/jarvis-progress.js`, banco IndexedDB `jarvis_games` e cópias atômicas separadas na pasta `games-data` do userData do JARVIS instalado. As chaves de um jogo não são aceitas nas rotas dos demais. O iframe restaura o save antes de iniciar o código do jogo e confirma a gravação ao voltar ao catálogo.

Minecraft salva seed, alterações de blocos, posição, inventário, armadura, vida/fome, tempo e fornalhas a cada cinco segundos, ao pausar e ao voltar ao catálogo. Há um mundo local por aparelho; Novo mundo pede confirmação. Mobs e itens soltos são recriados pelo motor, não são um snapshot integral da simulação. Os outros jogos preservam recordes, moedas, compras e estatísticas conforme a mecânica original, sem salvar uma partida em andamento.

## Capas e prompts finais

Quatro capas originais criadas com a ferramenta integrada imagegen (modo built-in). A capa existente `public/games/minecraft-game-cover.webp` foi preservada. A arte do Tetris não contém texto; o título é sobreposto pela interface do catálogo.

### battle-royale

Arquivo: `public/games/battle-royale-cover.png`.

Wide landscape cover illustration for a cartoon 3D adventure game titled exactly BATTLE ROYALE. A vibrant island with colorful hills and small towns, an airborne bus suspended under a balloon and a tiny adventurer safely gliding above the landscape. Original friendly stylized graphics, no combat, no weapons, no existing character designs or logos, no watermark. Clean bold headline, readable in a small game-library thumbnail.

### tetris

Arquivo: `public/games/tetris-cover.png`.

Create an original wide landscape arcade puzzle artwork. Colorful geometric tile clusters falling towards a rectangular dark grid, luminous cyan, magenta, orange, green and yellow squares, polished playful 3D illustration with a clear readable composition for a small catalogue thumbnail. No text, no letters, no logos, no characters, no watermark.

### flappy-bird

Arquivo: `public/games/flappy-bird-cover.png`.

Use case: stylized-concept. Asset type: wide landscape game catalogue cover for a dark Jarvis Games desktop library. A charming round yellow pixel-art inspired bird flying through green pipes in a bright blue sky, floating golden coins, cheerful arcade illustration with depth, bold readable composition. Exact headline text: "FLAPPY BIRD", large crisp readable game typography. Cohesive polished cover, legible at small thumbnail size, no watermark, no additional text.

### agario

Arquivo: `public/games/agario-cover.png`.

Use case: stylized-concept. Asset type: wide landscape game catalogue cover for a dark Jarvis Games desktop library. Large glossy colorful circular cells absorbing tiny glowing food dots on a clean dark grid, an exciting chase between large and small cells and a green spiky virus, polished arcade illustration. Exact headline text: "AGAR.IO", large crisp readable game typography. Cohesive polished cover, legible at small thumbnail size, no watermark, no additional text.


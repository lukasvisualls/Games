# Modelos fornecidos e preparação local

Revisão 1.3.0 preparada para distribuição após autorização do usuário para substituir os itens pendentes. Os metadados dos arquivos não constituem comprovação independente de titularidade.

`assets/credits.json` preserva para cada um dos 22 arquivos distribuídos o título, autor, origem, licença declarada, tamanho e SHA256. Quinze são arquivos enviados declarados CC-BY-4.0, preservados sem alteração; sete são novos modelos originais CC0 gerados por `scripts/build-battle-originals.mjs`. Os créditos com links de origem também aparecem no menu do jogo. GLBs e colisões geradas ficam no pacote da Release, não são incorporados ao histórico Git; para desenvolver, extraia o pacote da Release em `games/battle-royale`.

Os seis modelos Standard (city, abandoned, alley, classroom, factory, stone-wall) e o personagem derivado de Payday 2 NÃO fazem parte desta distribuição. As cópias locais anteriores e suas colisões foram guardadas fora do repositório, em pasta não publicada. Os arquivos pessoais enviados não foram alterados. Os substitutos têm geometria original: cidade modular, bairro de sobrevivência, beco industrial, escola, fábrica, muro e Sentinela JARVIS; sem usar malhas, texturas ou esqueleto dos arquivos excluídos. Os demais modelos declaram CC-BY-4.0; preservar atribuição e links. O empacotador verifica licença, origem, hashes e a ausência dos itens excluídos antes de criar o ZIP.

## Modificações no protótipo

- Modelos posicionados e redimensionados em um mapa original de 4 × 4 km. Não representa topografia, localização ou escala geográfica exata dos locais escaneados.
- Malhas estáticas combinadas por material e texturas de cenário reduzidas a até 1024 pixels na memória. GLBs originais preservados.
- Grades derivadas de colisão e pisos geradas por `scripts/bake-battle-scenery.mjs`. São aproximações, não geometrias exatas de colisão.
- Sentinela JARVIS: personagem e esqueleto originais de 40 articulações, movimentos procedurais para marcha, cabeça e braços/mãos. Sem clipes de captura de movimento nem animação individual de dedos preparada. IDs internos antigos `swat`, `forest`, `desert`, `night` preservados para não perder escolhas salvas; agora são variações do Sentinela, não do FBI.
- SWAT BL: sem esqueleto/animações na origem. Triângulos separados em partes rígidas, com movimento simplificado de braços, pernas e cabeça. A opção no menu informa a simplificação.
- Variações de uniforme por tonalidade; não se afirma que sejam modelos diferentes fornecidos por seus autores.
- Three.js r149 e os carregadores/clonagem/combinação oficiais sob MIT; cópia da licença em `engine/vendor/LICENSE`. Runtime gerado por `scripts/build-battle-loader.mjs`, sem outro Three.js ou CDN.

## Limites de jogabilidade

18 conjuntos de cenário, árvores e gramíneas instanciadas. Interação de arma/baú/farm e construções vem do motor original. Cenários importados são estáticos; não tornam cada porta, objeto, móvel ou carro interativo. Carros desta revisão são decorativos, não dirigíveis. Bots usam a IA existente, com desvio simples e sem navegação profissional dentro de todo edifício. Passagens estreitas, colisões aproximadas, aparência e desempenho precisam de confirmação manual no computador alvo.

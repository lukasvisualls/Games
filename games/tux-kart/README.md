# Super Tux Kart no JARVIS

Esta pasta documenta a integração do Super Tux Kart com o catálogo do JARVIS Games.

O ZIP enviado contém o código-fonte C++ do projeto e não é um pacote executável. Para evitar publicar código duplicado ou um jogo que não abre, o catálogo usa o instalador oficial Windows x64 da release 1.5, verifica tamanho e SHA-256 antes de executá-lo e detecta o `supertuxkart.exe` instalado.

- Projeto oficial: https://github.com/supertuxkart/stk-code
- Release usada: https://github.com/supertuxkart/stk-code/releases/tag/1.5
- Licença: consulte `COPYING` no projeto oficial.

O botão **Jogar com amigo** envia o convite pelo JARVIS e abre o jogo nos dois computadores. A escolha da mesma sala/servidor continua sendo feita no multiplayer próprio do Super Tux Kart.

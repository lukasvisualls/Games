# CS 1.6 — instalação pelo JARVIS

O pacote atual é o instalador original Inno Setup, não uma pasta portátil. O JARVIS 2.1.133 usa `catalog-v3.json` para baixar `cs-installer.zip`, conferir tamanho/SHA-256 e a identidade fixa do EXE, instalar uma vez na pasta dinâmica de dados do próprio aplicativo e registrar a conclusão. Jogar reutiliza a instalação pela janela integrada; Reparar preserva configurações e saves conhecidos. Nenhum caminho de Jonathan é utilizado.

A instalação no Windows concluiu com código 0. A abertura do jogo no runner encontrou erro de modo de vídeo; a tentativa com renderização por software terminou sem manter a janela. **Jogabilidade e funcionamento em GPU real não estão aprovados.** O pacote permanece candidato/pré-release e o card informa a limitação. Os binários não foram modificados nem a autenticação contornada.

Teste original: https://github.com/lukasvisualls/Games/actions/runs/38880211507
Teste de software: https://github.com/lukasvisualls/Games/actions/runs/38881031756

- `package.json`: manifesto do instalador atual.
- `portable-blocked.json`: manifesto histórico da cópia de pasta, bloqueada por autenticação.
- `test-installer-windows.ps1`: teste de instalação e diagnóstico de duas aberturas; não converte erro gráfico em sucesso.
- `test-windows.ps1`: diagnóstico histórico da pasta portátil.
- `prepare-release.ps1`: prepara apenas um rascunho, sem publicar automaticamente.

O instalador pode solicitar permissão do Windows e gravar registro/desinstalador no computador de destino. Não há afirmação de portabilidade. Sem código-fonte/DRM do CS, não é possível impedir a abertura direta do executável fora do JARVIS.

Catálogos v1 e v2 continuam preservados para versões antigas do aplicativo.

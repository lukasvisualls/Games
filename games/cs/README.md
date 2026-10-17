# Counter-Strike 1.6 — instalador nativo

Este jogo usa o tipo `native-installer` do launcher principal do JARVIS. Não há launcher paralelo, script Steam, `.bat` ou `.ps1`.

O instalador deve ser publicado manualmente como asset `Counter-Strike.exe` na Release/tag `cs-installer-1.6.0`. O catálogo estável mantém o item desativado até existir confirmação do direito de redistribuição.

- URL esperada: `https://github.com/lukasvisualls/Games/releases/download/cs-installer-1.6.0/Counter-Strike.exe`
- SHA-256 analisado: `0b2c919f8fe3d145dbe4258d91b7436de70134b2abb8b200911be7fddf6198e6`
- Tamanho analisado: `279164882` bytes
- Executável instalado esperado: `hl.exe`

O JARVIS baixa para `%LOCALAPPDATA%\JARVIS\Downloads`, valida tamanho e hash, abre o instalador de forma interativa e procura a instalação. O caminho encontrado é salvo em `%LOCALAPPDATA%\JARVIS\Games\cs\native-install.json`.

Não habilite o item apenas porque o instalador abre. Antes da publicação, confirme licença de redistribuição, instalação limpa, abertura real do jogo e detecção do executável em Windows.

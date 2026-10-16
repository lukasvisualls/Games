# CS para JARVIS Games — candidato

O pacote de entrada é a pasta instalada fornecida pelo usuário, `CS 1.6.zip`, preservada sem executar ou modificar os binários. `Counter-Strike-Full.zip` é um instalador separado e não é o pacote usado pelo launcher.

O manifesto registra tamanho, SHA-256, executável e argumentos. Nenhum caminho depende de nome de usuário, Desktop ou Downloads. O aplicativo usa sua pasta de dados dinâmica: `downloaded-games/cs/current/CS 1.6/hl.exe`, iniciando com o diretório de trabalho ao lado do executável.

A extração real encontrou os arquivos essenciais. A análise PE identificou um executável nativo de 32 bits e bibliotecas de entrada/vídeo do Windows (DInput/DDraw), áudio e rede. `msvcr100.dll` e `msvcp100.dll` estão incluídas na pasta fornecida. Os arquivos do runtime principal analisados não importam Java ou .NET. Os binários Steam e bibliotecas personalizadas também foram preservados; compatibilidade com Steam, servidores e anti-cheat não foi comprovada. A análise estática não confirma que o jogo abre em um Windows limpo.

**Situação:** aguardando execução em Windows, confirmação das dependências reais e envio do ZIP à release. Não adicionar ao catálogo estável enquanto o asset não existir e o início do jogo não tiver sido validado.

O preparo de release em `prepare-release.ps1` valida o pacote por hash e cria somente um rascunho, sem alterar o catálogo ou a distribuição dos jogos existentes.

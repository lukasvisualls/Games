# CS para JARVIS Games — candidato

O pacote de entrada é a pasta instalada fornecida pelo usuário, `CS 1.6.zip`, preservada sem modificar os binários. `Counter-Strike-Full.zip` é um instalador separado e não é o pacote usado pelo launcher.

O manifesto registra tamanho, SHA-256, executável e argumentos. Nenhum caminho depende de nome de usuário, Desktop ou Downloads. O aplicativo usa sua pasta de dados dinâmica: `downloaded-games/cs/current/CS 1.6/hl.exe`, iniciando com o diretório de trabalho ao lado do executável.

A extração real encontrou os arquivos essenciais. A análise PE identificou um executável nativo de 32 bits e bibliotecas de entrada/vídeo do Windows (DInput/DDraw), áudio e rede. `msvcr100.dll` e `msvcp100.dll` estão incluídas. Os arquivos do runtime principal analisados não importam Java ou .NET. Os binários Steam e bibliotecas personalizadas foram preservados; compatibilidade com Steam, servidores e anti-cheat não foi comprovada.

O ZIP já está na release **em rascunho** `cs-1.6.0`. O GitHub confirmou 382.265.674 bytes e SHA-256 `73c0636452fcb610750268ed9a27fbe44076da6ce04b528fd3f29fb7b14089f4`.

O workflow `cs-windows-candidate.yml` baixa esse asset autenticado, confere hash/tamanho e tenta abrir `hl.exe` duas vezes numa pasta dinâmica com espaços, sem reinstalar ou baixar o pacote entre os inícios. Não instala runtimes adicionais. Registra código de saída, mensagens de janelas e capturas no mesmo rascunho. Uma janela precisa permanecer viva e responder por 20 segundos; erro/interrupção reprova. O processo criado é encerrado e a pasta temporária é removida.

**Limite:** o runner Windows tem seus próprios runtimes/drivers. Mesmo dois inícios aprovados não comprovam portabilidade completa, jogabilidade, saves, servidores, Steam/anti-cheat, escala ou incorporação da janela ao Jarvis. Não adicionar ao catálogo estável antes da validação técnica final.

O preparo em `prepare-release.ps1` cria somente rascunho. Nenhum desses scripts altera o catálogo ou publica a distribuição dos jogos existentes.

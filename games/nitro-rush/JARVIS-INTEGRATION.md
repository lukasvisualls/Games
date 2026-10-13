# Nitro Rush no JARVIS

Origem: https://github.com/vitormenoli/Nitro-Rush
Autor: Vitor Menoli. Revisão importada: 6384bb50a4395479a70eb9600b4140aed8be61f8.
README original preservado, incluindo créditos de mapas, dados e modelo opcional.
O repositório original não declara uma licença de código; esta integração não altera essa condição nem concede direitos sobre o material original.

Adaptações: carregamento local do Three.js 0.160.0 e módulos de pós-processamento/glTF, fontes de reserva do sistema, persistência Jarvis antes do boot, salvamento de economia e fantasmas.
`engine/three.bundle.js` é gerado com esbuild a partir de `src/three-entry.js` e do pacote npm three@0.160.0; licença MIT copiada em `engine/THREE-LICENSE.txt`.
O modelo de carro externo continua opcional, com carro procedural caso a rede falhe.

Progresso: banco IndexedDB `jarvis_games`, store `progress`; cópia em disco `games-data/nitro-rush.json` na pasta userData do JARVIS instalado. Salva moedas, XP, inventário, melhorias, campanha, recordes e fantasmas. Atualizações do programa preservam a pasta de dados. Não há sincronização entre computadores.

Capa original criada pela ferramenta integrada de geração de imagens (skill imagegen).
Prompt: “Capa horizontal para Nitro Rush 3D; carro esportivo 3D estilizado em circuito, nitro, sensação de velocidade, título NITRO RUSH 3D, composição legível no catálogo escuro, sem marcas de carros ou marcas d'água.”

# Games para JARVIS 2.1.143

- SuperTuxKart 1.5 Windows x64: pacote portátil oficial, com a capa existente no JARVIS.
- VoxeLibre 0.92.3 + Luanti 5.17.0 Windows x64: Lua/assets originais e motor oficial, com capa própria no catálogo.
- Nitro Rush 1.1.1: predição local do convidado, reconciliação, suavização e descarte de amostras antigas. Requer JARVIS 2.1.143 nos dois computadores.

`catalog-v3.json` destina-se à versão nova. Os manifestos v2 e legado são mantidos sem mudanças para os aplicativos anteriores.

Os jogos nativos não foram modificados e preservam licenças/atribuições. Os fontes correspondentes de STK, Luanti, VoxeLibre e bibliotecas LGPL seguem nesta Release, com tamanhos/hashes/origens em `source-archives.json`. Receitas e avisos específicos estão nas pastas `games/tux-kart` e `games/voxelibre` do repositório. Arte da capa VoxeLibre é ilustração promocional para o launcher, não screenshot ou marca oficial.

Saves e configurações ficam no computador e fora das pastas atualizadas dos pacotes. Não distribuímos mundos, credenciais ou configurações pessoais. Os dois jogos nativos usam as opções de rede originais; esta atualização não cria convites Amigos para eles.

Testes locais: motores oficiais como janelas filhas do JARVIS, redimensionamento/fechamento, mundo VoxeLibre com mods, download e extração dos ZIPs reais com rollback, saves preservados, Nitro com dois motores/WebRTC, 180–210 ms por direção e 25% de perda, convites/recusa/saída e resultados. A sinalização dos testes foi isolada, sem contas reais. Desempenho de GPU e rede varia; TURN pode ser necessário em redes restritas. Não há promessa de latência zero.

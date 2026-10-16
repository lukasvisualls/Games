param([Parameter(Mandatory=$true)][string]$PackagePath)
$ErrorActionPreference = 'Stop'
$manifest = Get-Content -Raw (Join-Path $PSScriptRoot 'package.json') | ConvertFrom-Json
$package = Get-Item -LiteralPath $PackagePath
if ($package.Length -ne $manifest.size) { throw 'Tamanho do pacote diferente do manifesto.' }
if ((Get-FileHash -LiteralPath $package.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.sha256) { throw 'SHA-256 diferente do manifesto.' }
$stage = Join-Path ([IO.Path]::GetTempPath()) ('jarvis-cs-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
try {
 Copy-Item -LiteralPath $package.FullName -Destination (Join-Path $stage 'cs-installer.zip')
 $isDraft = gh release view cs-installer-1.6.1 --repo lukasvisualls/Games --json isDraft --jq .isDraft
 if ($LASTEXITCODE -eq 0 -and $isDraft -ne 'true') { throw 'O destino nao e rascunho. Nao sobrescrever uma release publicada.' }
 if ($LASTEXITCODE -ne 0) {
  gh release create cs-installer-1.6.1 --repo lukasvisualls/Games --draft --prerelease --title 'CS 1.6 - instalador candidato' --notes 'Instalador original fornecido pelo usuario. Instalacao confirmou saida zero no Windows; partida ainda nao foi validada no ambiente grafico do runner. Distribuicao candidata, sem garantia de jogabilidade.'
  if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o rascunho.' }
 }
 gh release upload cs-installer-1.6.1 (Join-Path $stage 'cs-installer.zip') --repo lukasvisualls/Games --clobber
 if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel enviar o pacote.' }
} finally { Remove-Item -LiteralPath $stage -Recurse -Force }

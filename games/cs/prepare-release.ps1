param([Parameter(Mandatory=$true)][string]$PackagePath)
$ErrorActionPreference = 'Stop'
$manifest = Get-Content -Raw (Join-Path $PSScriptRoot 'package.json') | ConvertFrom-Json
$package = Get-Item -LiteralPath $PackagePath
if ($package.Length -ne $manifest.size) { throw 'Tamanho do pacote diferente do manifesto.' }
if ((Get-FileHash -LiteralPath $package.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.sha256) { throw 'SHA-256 diferente do manifesto.' }
$stage = Join-Path ([IO.Path]::GetTempPath()) ('jarvis-cs-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
try {
 Copy-Item -LiteralPath $package.FullName -Destination (Join-Path $stage 'cs.zip')
 gh release view cs-1.6.0 --repo lukasvisualls/Games *> $null
 if ($LASTEXITCODE -ne 0) {
  gh release create cs-1.6.0 --repo lukasvisualls/Games --draft --prerelease --title 'CS 1.6 - candidato para JARVIS' --notes 'Pacote fornecido pelo usuario. Analise estatica e extracao concluidas; execucao em Windows pendente. Nao promover ao catalogo estavel antes da validacao.'
  if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel criar o rascunho.' }
 }
 gh release upload cs-1.6.0 (Join-Path $stage 'cs.zip') --repo lukasvisualls/Games --clobber
 if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel enviar o pacote.' }
} finally { Remove-Item -LiteralPath $stage -Recurse -Force }

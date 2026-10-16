param(
    [Parameter(Mandatory = $true)][string]$ZipPath,
    [Parameter(Mandatory = $true)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
$manifest = Get-Content (Join-Path $PSScriptRoot 'installer.json') -Raw | ConvertFrom-Json
$zip = Get-Item $ZipPath
if ($zip.Length -ne $manifest.size) { throw 'Tamanho inesperado do pacote.' }
if ((Get-FileHash $zip.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.sha256) { throw 'SHA-256 inesperado do pacote.' }
New-Item $OutputPath -ItemType Directory -Force | Out-Null
$root = Join-Path $env:RUNNER_TEMP ('Jarvis CS Test ' + [guid]::NewGuid())
New-Item $root -ItemType Directory | Out-Null
Expand-Archive -LiteralPath $zip.FullName -DestinationPath $root
$installer = Join-Path $root $manifest.installer
if ((Get-FileHash $installer -Algorithm SHA256).Hash.ToLowerInvariant() -ne '0b2c919f8fe3d145dbe4258d91b7436de70134b2abb8b200911be7fddf6198e6') { throw 'Instalador inesperado.' }
$destination = Join-Path $root 'CS 1.6'
$setup = Start-Process -FilePath $installer -ArgumentList @('/VERYSILENT','/SP-','/NORESTART','/RESTARTEXITCODE=3010','/NOCLOSEAPPLICATIONS','/NORESTARTAPPLICATIONS','/NOICONS','/TASKS=','/LANG=brazilianportuguese', ('/DIR="' + $destination + '"'), ('/LOG="' + (Join-Path $OutputPath 'cs-installer.log') + '"')) -PassThru
if (-not $setup.WaitForExit(180000)) { Stop-Process -Id $setup.Id -Force; throw 'Instalador excedeu tres minutos.' }
if ($setup.ExitCode -ne 0) { throw "Instalador falhou: $($setup.ExitCode)" }
$executable = Join-Path $root $manifest.entry
if (-not (Test-Path $executable -PathType Leaf)) { throw 'Executavel ausente depois de extrair.' }

# Inspect visible error messages, without interacting with dialogs or changing binaries.
Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public static class CSWindows {
    public delegate bool Callback(IntPtr window, IntPtr data);
    [DllImport("user32.dll")] static extern bool EnumWindows(Callback callback, IntPtr data);
    [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr window, Callback callback, IntPtr data);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window, out uint process);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr window, StringBuilder text, int count);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr window);
    static string Text(IntPtr window) { var text = new StringBuilder(2048); GetWindowText(window, text, text.Capacity); return text.ToString(); }
    public static string[] Messages(uint pid) {
        var messages = new List<string>();
        EnumWindows((window, data) => {
            uint owner; GetWindowThreadProcessId(window, out owner);
            if (owner == pid && IsWindowVisible(window)) {
                var text = Text(window); if (text.Length > 0) messages.Add(text);
                EnumChildWindows(window, (child, unused) => { var value = Text(child); if(value.Length > 0) messages.Add(value); return true; }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
        return messages.ToArray();
    }
}
'@
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
$runs = @()
try {
    for ($attempt = 1; $attempt -le 2; $attempt++) {
        $process = $null
        $result = [ordered]@{ attempt = $attempt; executableRelative = $manifest.entry; arguments = @($manifest.arguments); exited = $false; exitCode = $null; title = ''; messages = @(); responding = $false; gameWindow = $false; error = $null }
        try {
            $process = Start-Process -FilePath $executable -WorkingDirectory (Split-Path $executable) -ArgumentList $manifest.arguments -PassThru
            $seen = [System.Collections.Generic.HashSet[string]]::new()
            for ($tick = 0; $tick -lt 40; $tick++) {
                Start-Sleep -Milliseconds 500
                $process.Refresh()
                foreach ($text in [CSWindows]::Messages($process.Id)) { [void]$seen.Add($text) }
                if ($process.HasExited) {
                    # Some GoldSrc builds restart hl.exe when changing video mode. Follow only the same installed binary.
                    $replacement = $null
                    for ($retry = 0; $retry -lt 10; $retry++) {
                        $replacement = Get-Process -Name hl -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $process.Id -and $_.Path -eq $executable } | Select-Object -First 1
                        if ($replacement) { break }; Start-Sleep -Milliseconds 500
                    }
                    if ($replacement) { $process.Dispose(); $process = $replacement } else { break }
                }
            }
            $process.Refresh()
            $result.processes = @(Get-Process -Name hl -ErrorAction SilentlyContinue | Select-Object Id,Path,MainWindowTitle)
            $result.exited = $process.HasExited
            $result.messages = @($seen)
            if ($process.HasExited) { $result.exitCode = $process.ExitCode }
            else {
                $result.title = $process.MainWindowTitle
                $result.responding = $process.Responding
                $result.gameWindow = $process.MainWindowHandle -ne [IntPtr]::Zero -and $process.MainWindowTitle -match 'Counter.Strike' -and $process.Responding
            }
            try {
                $screen = [System.Windows.Forms.SystemInformation]::VirtualScreen
                $image = [System.Drawing.Bitmap]::new($screen.Width, $screen.Height)
                $graphics = [System.Drawing.Graphics]::FromImage($image)
                try { $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $image.Size); $image.Save((Join-Path $OutputPath "cs-windows-$attempt.png")) }
                finally { $graphics.Dispose(); $image.Dispose() }
            } catch { $result.screenshotError = $_.Exception.Message }
        } catch { $result.error = $_.Exception.Message }
        finally {
            if ($null -ne $process) {
                $process.Refresh()
                if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
                $process.Dispose()
            }
        }
        $runs += [pscustomobject]$result
        if (-not $result.gameWindow) { break }
    }
} finally {
    $report = [ordered]@{
        date = [DateTime]::UtcNow.ToString('o')
        os = [Environment]::OSVersion.VersionString
        packageSha256 = $manifest.sha256
        noRuntimeInstalled = $true
        pathsUseDynamicTempWithSpaces = $true
        downloadedOnce = $true
        attempts = $runs
        portableConfirmed = $false
        installerExitCode = $setup.ExitCode
        installerExecutedOnce = $true
        limitation = 'Janela viva por 20 segundos nao comprova jogabilidade, saves, servidores, Steam/anti-cheat ou funcionamento em todo Windows. O runner possui runtimes e drivers proprios.'
    }
    $json = $report | ConvertTo-Json -Depth 8
    Set-Content (Join-Path $OutputPath 'cs-windows-result.json') $json -Encoding utf8
    Write-Output $json
    Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue
}
if ($runs.Count -ne 2 -or @($runs | Where-Object { -not $_.gameWindow }).Count) { throw 'CS nao manteve a janela do jogo em ambos os inicios. Consulte cs-windows-result.json e capturas.' }

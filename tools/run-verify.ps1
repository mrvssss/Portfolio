$ErrorActionPreference = 'Stop'
$root = 'c:\Users\Quanby - Guest\Downloads\video-editor-portfolio\video-editor-portfolio'
$candidates = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$chrome = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'no Chrome/Edge found' }

$uri = ([Uri] (Join-Path $root 'tools\verify.html')).AbsoluteUri
& $chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files `
  --virtual-time-budget=20000 --dump-dom $uri 2>$null | Set-Content (Join-Path $root 'tools\verify-dump.txt') -Encoding UTF8

$raw = Get-Content (Join-Path $root 'tools\verify-dump.txt') -Raw
$m = [regex]::Match($raw, 'BEGIN\r?\n([\s\S]*?)\r?\nEND')
if (-not $m.Success) { throw 'no render report produced' }
[System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value) | Set-Content (Join-Path $root 'tools\verify-report.txt') -Encoding UTF8
Write-Output 'verify report written'

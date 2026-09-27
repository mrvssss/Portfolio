$ErrorActionPreference = 'Stop'
$root = 'c:\Users\Quanby - Guest\Downloads\video-editor-portfolio\video-editor-portfolio'
$svg = Get-Content (Join-Path $root 'assets\logos\deped-logo.svg') -Raw
$svg = ($svg -replace '<\?xml[^>]*\?>', '') -replace '<!--.*?-->', ''

$html = @"
<!doctype html>
<html><head><meta charset="utf-8"><title>mark</title><style>body{margin:0;background:#fff}svg{overflow:visible}</style></head>
<body>
<div id="stage">$svg</div>
<pre id="out">pending</pre>
<script>
const svg = document.querySelector('#stage svg');
const all = Array.prototype.slice.call(svg.querySelectorAll('g,path,rect,circle,ellipse,polygon'));
const inMarkColumn = function (b) { return b.x >= 188 && b.x + b.width <= 296; };
const isCaption = function (b) { return b.y >= 205 || b.width > 260; };
const markNodes = [];
all.forEach(function (el) {
  const b = el.getBBox();
  if (isCaption(b) || !inMarkColumn(b)) { return; }
  markNodes.push(el);
});
const kept = markNodes.filter(function (el) {
  return !markNodes.some(function (other) { return other !== el && other.contains(el); });
});
const survivors = kept.slice().sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
let info = 'nodes=' + survivors.map(function (n) { return n.tagName + ':' + (n.getAttribute('fill') || 'inherit'); }).join(',');
let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
survivors.forEach(function (el) {
  const b = el.getBBox();
  if (b.x < x0) { x0 = b.x; }
  if (b.y < y0) { y0 = b.y; }
  if (b.x + b.width > x1) { x1 = b.x + b.width; }
  if (b.y + b.height > y1) { y1 = b.y + b.height; }
});
const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
x0 -= pad; y0 -= pad;
const w = (x1 - x0) + pad * 2;
const h = (y1 - y0) + pad * 2;
const rebuilt = svg.cloneNode(false);
survivors.forEach(function (el) { rebuilt.appendChild(el.cloneNode(true)); });
rebuilt.setAttribute('viewBox', Math.round(x0) + ' ' + Math.round(y0) + ' ' + Math.round(w) + ' ' + Math.round(h));
rebuilt.setAttribute('width', Math.round(w));
rebuilt.setAttribute('height', Math.round(h));
rebuilt.removeAttribute('class');
rebuilt.removeAttribute('id');
const serialized = new XMLSerializer().serializeToString(rebuilt);
document.getElementById('out').textContent = 'SVGBEGIN' + String.fromCharCode(10) + serialized + String.fromCharCode(10) + 'SVGEND';
document.getElementById('out').setAttribute('data-info', info + ' bbox=' + [x0, y0, x1, y1].join(','));
</script>
</body></html>
"@

$work = Join-Path $root 'tools\deped-mark.html'
Set-Content -Path $work -Value $html -Encoding UTF8
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$dump = Join-Path $root 'tools\deped-mark-dump.txt'
& $chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=4000 --dump-dom "file:///$($work -replace '\\','/')" 2>$null |
  Set-Content -Path $dump -Encoding UTF8

$raw = Get-Content $dump -Raw
$m = [regex]::Match($raw, 'SVGBEGIN\r?\n([\s\S]*?)\r?\nSVGEND')
if (-not $m.Success) { throw 'mark extraction failed - no serialized svg' }
$mark = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value).Trim() -replace '<!---->', ''
if ($mark -notmatch '(?i)xmlns=') { throw 'serialized svg missing xmlns' }
if ($mark -match '(?i)<(text|tspan)\b') { throw 'mark still contains text elements' }
$shapeCount = ([regex]::Matches($mark, '(?i)<(path|rect|circle|ellipse|polygon)\b')).Count
$nl = [Environment]::NewLine
$final = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + $nl + $mark + $nl
Set-Content -Path (Join-Path $root 'assets\logos\deped-emblem.svg') -Value $final -Encoding UTF8 -NoNewline
$info = ''
if ($raw -match 'data-info="([^"]*)"') { $info = ' info=' + $Matches[1] }
"shapeCount=$shapeCount chars=$($final.Length)$info" | Set-Content -Path (Join-Path $root 'tools\report7.txt') -Encoding UTF8
Write-Output 'mark built'

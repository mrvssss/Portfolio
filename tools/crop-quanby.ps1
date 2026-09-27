$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = 'c:\Users\Quanby - Guest\Downloads\video-editor-portfolio\video-editor-portfolio'
$src = Join-Path $root 'assets\logos\quanby-solutions-logo.png'
$dst = Join-Path $root 'assets\logos\quanby-logo-mark.png'
$out = Join-Path $root 'tools\report2.txt'
$log = @()

$img = New-Object System.Drawing.Bitmap $src
$w = $img.Width; $h = $img.Height
$colCount = New-Object 'int[]' $w
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    if ($img.GetPixel($x, $y).A -gt 24) { $colCount[$x]++ }
  }
}

# Walk empty runs and report them, so the mark / text boundary is verifiable.
$runs = @()
$runStart = -1
for ($x = 0; $x -lt $w; $x++) {
  $isEmpty = $colCount[$x] -eq 0
  if ($isEmpty -and $runStart -lt 0) { $runStart = $x }
  if ((-not $isEmpty) -and $runStart -ge 0) {
    if ($x - $runStart -ge 10) { $runs += [pscustomobject]@{ Start = $runStart; End = $x - 1 } }
    $runStart = -1
  }
}
$log += "empty column runs: " + (($runs | ForEach-Object { "$($_.Start)-$($_.End)" }) -join ', ')

# The mark is everything before the first interior gap.
$firstGap = $runs | Where-Object { $_.Start -gt 0 } | Select-Object -First 1
if (-not $firstGap) { throw 'No interior gap found - cannot isolate the mark.' }
$limitX = $firstGap.Start

$minX = $w; $minY = $h; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $limitX; $x++) {
    if ($img.GetPixel($x, $y).A -gt 24) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$log += "mark bbox x $minX-$maxX  y $minY-$maxY"

# Dominant opaque colors of the mark (checks it is not white-on-transparent).
$colors = @{}
for ($y = $minY; $y -le $maxY; $y += 2) {
  for ($x = $minX; $x -le $maxX; $x += 2) {
    $p = $img.GetPixel($x, $y)
    if ($p.A -gt 200) {
      $key = '#{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B
      if ($colors.ContainsKey($key)) { $colors[$key] = $colors[$key] + 1 } else { $colors[$key] = 1 }
    }
  }
}
$log += "mark colors: " + (($colors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 8 | ForEach-Object { "$($_.Key) x$($_.Value)" }) -join ', ')

# Square padding so the mark keeps a 1:1 frame like the other emblems.
$bw = $maxX - $minX + 1
$bh = $maxY - $minY + 1
$size = [Math]::Max($bw, $bh)
$pad = [int][Math]::Round($size * 0.04)
$size = $size + (2 * $pad)
$cx = $minX + ($bw / 2.0)
$cy = $minY + ($bh / 2.0)
$cropX = [Math]::Max(0, [int][Math]::Round($cx - $size / 2.0))
$cropY = [Math]::Max(0, [int][Math]::Round($cy - $size / 2.0))
if ($cropX + $size -gt $w) { $size = $w - $cropX }
if ($cropY + $size -gt $h) { $size = $h - $cropY }

$rect = New-Object System.Drawing.Rectangle $cropX, $cropY, $size, $size
$cropped = $img.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cropped.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$log += "saved $dst crop=$cropX,$cropY size=${size}x${size} aspect=$([Math]::Round($size/$size,2)) markAspect=$([Math]::Round($bw/$bh,3))"
$cropped.Dispose(); $img.Dispose()

# Re-open the saved file and confirm it is a transparent, square, non-empty mark.
$check = New-Object System.Drawing.Bitmap $dst
$opaque = 0; $clear = 0
for ($y = 0; $y -lt $check.Height; $y += 3) {
  for ($x = 0; $x -lt $check.Width; $x += 3) {
    if ($check.GetPixel($x, $y).A -gt 24) { $opaque++ } else { $clear++ }
  }
}
$log += "verify saved: $($check.Width)x$($check.Height) opaqueSamples=$opaque clearSamples=$clear fill=$([Math]::Round($opaque/($opaque+$clear),3))"
$check.Dispose()

Set-Content -Path $out -Value $log -Encoding UTF8
Write-Output "done"

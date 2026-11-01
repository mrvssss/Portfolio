param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 8765
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$rootPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$rootPrefix = $rootPath.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$allowedVideoIds = @(
  "1BiX3a0gwJV4_x8pyCG_g06KOIWh4gqRu",
  "14XFI63H0WCrE6YKmWakEeVRTn1YsuMh0",
  "114niZEH38hlTI4XPyJ0U5Mr_QHOIgMUU",
  "1KdA3yZOkEAo1lewmwrV8iKa0WuC0o9xU",
  "1lAkY49E4Ro356XwTjLTa77VQ4K7a3o5R",
  "1XGsrEm5Caa4RMW5086Nq8PIGOPHhDCNz",
  "1Q4J8jz0TqCvUgegjXnCtSAJDOPYtAxvG",
  "1CGi5XQbRn2uJbsKB0EpmRt9eViXzoH3u",
  "1b2B5_kWeyuWM6apqQh5XbuXgGr70DQC_",
  "1_UhOCi1VJ2Z5fKiFRtSI5uZCk6cL7Nc_",
  "1vtCERbIDONugplg_KWCmDtavDAnak-I9",
  "1SYet_2sdRHfND-AYXxdCWFtkZuwAVMEy",
  "1AGch4qs7Tpsc6V67uovvyATKj631w-Zi",
  "1oCq6NUgcASYRNbliH4w8GDipsNSbKkFB",
  "1wOBVCcmTBta10c1zfeChfsaV-kUZ9O2_",
  "13nnYVKcbdf6C4SOsGCkURLZYRpPMZ6L9",
  "1abN4r-eQDm6BVIuJ863qMXKGlYoU5itC"
)
$allowedVideoIdSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$allowedVideoIds | ForEach-Object { [void]$allowedVideoIdSet.Add($_) }
$contentTypes = @{
  ".css" = "text/css; charset=utf-8"
  ".html" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml"
  ".webp" = "image/webp"
  ".woff2" = "font/woff2"
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
$httpClient = [System.Net.Http.HttpClient]::new()
Write-Host "Portfolio preview: http://127.0.0.1:$Port/main.html"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response

    try {
      $request = $context.Request
      $requestPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)

      if ($requestPath -eq "/video") {
        if ($request.HttpMethod -ne "GET" -and $request.HttpMethod -ne "HEAD") {
          $response.StatusCode = 405
          $response.Headers.Add("Allow", "GET, HEAD")
          continue
        }

        $fileId = $request.QueryString["id"]
        if (-not $allowedVideoIdSet.Contains($fileId)) {
          $response.StatusCode = 404
          continue
        }

        $method = if ($request.HttpMethod -eq "HEAD") {
          [System.Net.Http.HttpMethod]::Head
        } else {
          [System.Net.Http.HttpMethod]::Get
        }
        $upstreamRequest = [System.Net.Http.HttpRequestMessage]::new(
          $method,
          "https://drive.google.com/uc?export=download&id=$fileId"
        )
        if ($request.Headers["Range"]) {
          $upstreamRequest.Headers.Range = [System.Net.Http.Headers.RangeHeaderValue]::Parse($request.Headers["Range"])
        }

        $upstreamResponse = $httpClient.SendAsync(
          $upstreamRequest,
          [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
        ).GetAwaiter().GetResult()

        $response.StatusCode = [int]$upstreamResponse.StatusCode
        if ($upstreamResponse.Content.Headers.ContentType) {
          $response.ContentType = $upstreamResponse.Content.Headers.ContentType.ToString()
        }
        $response.SendChunked = $true
        if ($upstreamResponse.Content.Headers.ContentRange) {
          $response.Headers.Add("Content-Range", $upstreamResponse.Content.Headers.ContentRange.ToString())
        }
        $response.Headers.Add("Accept-Ranges", "bytes")
        $response.Headers.Add("Content-Disposition", "inline")

        if ($request.HttpMethod -eq "GET") {
          $mediaStream = $upstreamResponse.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
          $buffer = [byte[]]::new(65536)
          $remainingBytes = $upstreamResponse.Content.Headers.ContentLength
          if ($null -eq $remainingBytes) {
            $mediaStream.CopyToAsync($response.OutputStream).GetAwaiter().GetResult()
          } else {
            while ($remainingBytes -gt 0) {
              $bytesToRead = [int][Math]::Min($buffer.Length, $remainingBytes)
              $bytesRead = $mediaStream.ReadAsync($buffer, 0, $bytesToRead).GetAwaiter().GetResult()
              if ($bytesRead -eq 0) {
                break
              }
              $response.OutputStream.Write($buffer, 0, $bytesRead)
              $remainingBytes -= $bytesRead
            }
          }
          $mediaStream.Dispose()
        }

        $upstreamResponse.Dispose()
        $upstreamRequest.Dispose()
        continue
      }

      if ($request.HttpMethod -ne "GET" -and $request.HttpMethod -ne "HEAD") {
        $response.StatusCode = 405
        $response.Headers.Add("Allow", "GET, HEAD")
        continue
      }

      $relativePath = if ($requestPath -eq "/") { "index.html" } else { $requestPath.TrimStart("/") }
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)))
      if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $response.StatusCode = 404
        continue
      }

      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      if ($contentTypes.ContainsKey($extension)) {
        $response.ContentType = $contentTypes[$extension]
      } else {
        $response.ContentType = "application/octet-stream"
      }
      $fileStream = [System.IO.File]::OpenRead($filePath)
      $response.ContentLength64 = $fileStream.Length
      if ($request.HttpMethod -eq "GET") {
        $fileStream.CopyToAsync($response.OutputStream).GetAwaiter().GetResult()
      }
      $fileStream.Dispose()
    } catch {
      Write-Warning $_.Exception.Message
      $response.StatusCode = 502
    } finally {
      $response.Close()
    }
  }
} finally {
  $httpClient.Dispose()
  $listener.Stop()
  $listener.Close()
}
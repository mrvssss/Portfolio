const allowedVideoIds = new Set([
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
  "1abN4r-eQDm6BVIuJ863qMXKGlYoU5itC",
]);

export default async (request: Request): Promise<Response> => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const fileId = new URL(request.url).searchParams.get("id") ?? "";
  if (!allowedVideoIds.has(fileId)) {
    return new Response("Video not found", { status: 404 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
    { method: request.method, headers: range ? { Range: range } : undefined },
  );

  const headers = new Headers();
  for (const name of ["accept-ranges", "content-length", "content-range", "content-type", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  headers.set("Content-Disposition", "inline");
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
};
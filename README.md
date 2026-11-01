# Video editor portfolio — Marvin Cristopher Ubaldo

This is a real website: HTML, CSS, and a little JavaScript.
The root page is a short introduction landing page. Use its **Explore portfolio** button to open the full portfolio.

## Files

- `index.html` — introduction landing page
- `main.html` — full portfolio, including reel, clients, tools, experience, and contact
- `all-videos.html` — searchable gallery of all video projects
- `css/style.css` — colors, layout, mobile menu
- `js/main.js` — mobile menu, client carousel, scroll reveal, and contact form
- `netlify/edge-functions/video.ts` — same-origin streaming proxy for Drive videos
- `images/profile.png` — landing-page portrait

## Video playback

The reel streams through the `/video` Netlify Edge Function to support browser playback and seeking. Deploy the site to Netlify or run it with Netlify Dev; opening `main.html` directly as a local file does not run this route. The source Drive files must remain accessible to anyone with their links.

For a local Windows preview without Node.js, run `powershell -ExecutionPolicy Bypass -File tools/serve-local.ps1` and open `http://127.0.0.1:8765/main.html`.

## What to change first

1. Replace `images/profile.png` with your portrait.
2. Update your name and introduction in `index.html`.
3. Update your email address and video links in `main.html`.
4. Update reel project titles and links in `main.html` and `all-videos.html`.

YouTube embed: if your video URL is `https://www.youtube.com/watch?v=AbCd1234`, the embed URL is `https://www.youtube.com/embed/AbCd1234`.

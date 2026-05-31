# salonx-cube

A Next.js (App Router, TypeScript) application wrapping the **SALON X — Cube** interactive 3D experience.

The cube experience itself is a self-contained WebGL (Three.js) bundle that mounts into `#app`. To preserve the prototype 1:1, the original prototype is split into three parts:

- `app/cube.css` — the prototype's stylesheet (loaded globally via the root layout).
- `app/page.tsx` — renders the `#app` mount point and loads the cube bundle.
- `public/cube-bundle.js` — the bundled Three.js + cube application logic. It self-initializes on DOM ready and renders into `#app`.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Notes

- The cube bundle is loaded with `next/script` using the `afterInteractive` strategy so it runs once the `#app` mount point exists in the DOM.
- The source of truth for the experience is `public/cube-bundle.js`, extracted verbatim from `salonx-cube-prototype.html`. Edit it there to change cube behavior.
# salonx-cube

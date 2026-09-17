# Samiel Azmaien — Portfolio

[![Live site](https://img.shields.io/badge/Live_site-Open-0A66C2?style=flat-square)](https://samiel-azmaien.github.io/)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-deployed-222?style=flat-square&logo=github&logoColor=white)

A responsive personal portfolio for Samiel Azmaien, a Georgia Tech computer science student working across AI systems, search infrastructure, quantitative research, and applied machine learning.

## Highlights

- Cinematic monochrome landing page with a short system boot sequence
- Interactive licensed Sony PSP model with five cinematic project channels
- Pixel pointer trail, custom cursor, live telemetry, channel wipes, HUD, scanlines, and parallax
- Paid-session selector connected to Stripe-backed Calendly events
- Responsive layout, accessible controls, reduced-motion support, and invert mode

Stock-footage sources and license links are documented in [`MEDIA_CREDITS.md`](./MEDIA_CREDITS.md).

## Technology

- Semantic HTML
- Custom CSS
- Vanilla JavaScript
- three.js and glTF
- GitHub Actions and GitHub Pages

The site deliberately avoids a client-side framework so it remains fast, portable, and easy to maintain.

## Run locally

No build step is required:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## Repository structure

```text
index.html           Primary page source
styles.css           Layout, typography, and responsive styles
script.js            Navigation and reveal behavior
assets/              Portrait and project previews
.github/workflows/   GitHub Pages deployment
site/                Legacy snapshot retained for reference
```

The GitHub Pages workflow deploys the root source directly. The `site/` folder is an older snapshot and is not part of the live build.

## Deployment

Pushes to `main` trigger the Pages workflow. See [`DEPLOY.md`](./DEPLOY.md) for the original deployment notes.

## Content notes

Project links and quantitative claims should be reviewed whenever the underlying demos, reports, or repositories change. Concluded projects are labelled explicitly, and protected previews should not be presented as public demos.

## License

No project-wide license has been selected. Portraits, screenshots, and linked project assets may have separate rights.

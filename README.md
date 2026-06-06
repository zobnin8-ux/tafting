# Tufting Pattern Generator

A browser-based tool that converts uploaded images into tufting-ready rug patterns and estimates yarn consumption.

## Features

- Image upload (JPG, PNG, WEBP) with drag & drop
- K-Means color reduction (4–32 colors)
- Color palette with area and yarn estimates
- Projector-ready contour outlines
- Horizontally mirrored tufting template
- Optional tracing grid (imperial/metric)
- Noise reduction and edge smoothing
- Color merge suggestions
- Complexity analysis rating
- PNG and PDF export

## Tech Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- Zustand (state management)
- HTML5 Canvas (image processing)
- jsPDF (PDF export)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy

Deploy to [Vercel](https://vercel.com) with zero configuration.

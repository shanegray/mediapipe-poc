# Spineal MediaPipe POC
Quick posture-analysis prototype using MediaPipe Pose + Face landmarkers and a Vite/React front end.

## Setup
```bash
pnpm install
```

## Local Dev
```bash
pnpm start
```
Opens Vite dev server (default http://localhost:5173).

## Other Scripts
- `pnpm build` – production bundle
- `pnpm test` – Vitest suite
- `pnpm lint` / `pnpm format` / `pnpm check` – Biome linting + formatting

## Posture Analysis Notes
`src/services/postureAnalysis.ts` smooths MediaPipe landmarks, normalises by shoulder width, then scores posture via shoulder alignment, head/neck angles, chin position, and optional 3D-only checks (shoulder protraction, CVA, forward head posture). Metrics are sensitive to: mixed world-vs-image coordinates, limited shoulder keypoints (11/12 only), and noisy depth `z` values. Tune thresholds against logged metrics before trusting "good/bad" labels.

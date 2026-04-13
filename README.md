# Multiple Window Animation

A creative browser demo that synchronizes particle animations across multiple browser windows using `localStorage` as a cross-tab communication bus.

Open several windows side by side and watch particles orbit the center of each window — smoothly reacting to window movement, resizing, and new windows appearing.

## How it works

Each browser window registers itself in `localStorage` with its position, size, and a unique color. 600 particles are distributed evenly across all open windows and orbit their assigned window's center. When you move or resize a window, all other windows receive the update via the `storage` event and adjust the animation accordingly.

```
┌─────────────────────────────────────────────┐
│  Window A       Window B       Window C      │
│  (red orbit)    (blue orbit)   (green orbit) │
│                                              │
│  Particles smoothly interpolate between      │
│  positions as windows move                   │
└─────────────────────────────────────────────┘
```

## Architecture

```
src/
├── Models/
│   ├── BrowserWindow.ts   — window state (position, size, color)
│   └── Particle.ts        — particle state and circular motion logic
├── Services/
│   ├── Controller.ts      — animation loop orchestrator
│   └── Renderer.ts        — canvas 2D rendering
├── Managers/
│   ├── WindowManager.ts   — cross-tab window state synchronization
│   └── ParticleManager.ts — particle allocation across windows
└── Utils/
    ├── Color.ts           — HSL → RGB conversion
    ├── Storage.ts         — typed localStorage wrapper
    └── Timer.ts           — elapsed time tracking
```

**Key patterns:**
- `localStorage` as a shared message bus between tabs
- Observer pattern — managers expose `onChange` callbacks consumed by `Controller`
- Linear interpolation for smooth window position and particle movement transitions
- Deterministic pseudorandom particle initialization (seeded by particle index)

## Getting started

**Prerequisites:** Node.js 18+, Yarn

```bash
# Install dependencies
yarn

# Start development server with watch mode
yarn dev
```

Then open `dist/index.html` in your browser. Click the **+** button to open additional windows and place them side by side.

```bash
# Production build
yarn build

# Format + lint + type-check
yarn code
```

## Tech stack

| Tool | Version |
|---|---|
| TypeScript | 5.3 |
| Webpack | 5 |
| ESLint | 8 |
| Prettier | 3 |

No runtime dependencies — pure browser APIs only (Canvas, localStorage, requestAnimationFrame).

## Browser support

Requires a browser with:
- Canvas 2D API
- `localStorage`
- `storage` event (cross-tab communication)

Works best when windows are on the same screen so particles are visible across the physical display boundary.

## License

MIT

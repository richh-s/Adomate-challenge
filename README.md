Image Text Composer (Canvas 2D)

A lightweight, client-side image composer built with Next.js + React + TypeScript and the HTML Canvas 2D API.
Add text layers to a PNG, drag/resize/rotate with snapping guides, reorder layers, and export a PNG at the original image’s resolution. Includes autosave, undo/redo history, and custom font upload (TTF/OTF/WOFF/WOFF2).

✨ Features

Canvas UX

Drag to move; snap-to-center with purple vertical/horizontal guides

Resize via side handles (supports wrapping width)

Rotate via top handle (angle shown/controllable in panel)

Layer management

Select, duplicate, lock, toggle visibility

Drag-and-drop reordering (with drop indicator)

Bring forward / send backward buttons

Text styling

Font family (Google Fonts + custom upload)

Size, weight, color, opacity

Alignment (left/center/right)

Line height, letter spacing

Shadow (color, blur, offsets)

History & persistence

Undo/redo (40 snapshots) with visible History panel

Autosave to localStorage (restores after refresh; 10-minute freshness window)

Reset button clears state and storage

Export

Preserves original image dimensions (renders to offscreen canvas at natural size)

Keyboard shortcuts

⌫/Del delete, ⌘/Ctrl+D duplicate, ⌘/Ctrl+Z / ⇧⌘/Ctrl+Z undo/redo, arrows nudge (⇧ = 10px)

🚀 Quick start
Prereqs

Node.js ≥ 18

pnpm or yarn or npm

Install & run
# clone your public repo, then:
pnpm install       # or: yarn / npm install
pnpm dev           # or: yarn dev / npm run dev

# open http://localhost:3000

Build
pnpm build && pnpm start   # Next.js production build

Environment variables

The demo uses a hard-coded Google Fonts API key for convenience.
For production, place your key in .env.local at the project root:

# .env.local
NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=AIzaSyClJb5bio8gEWF3KWs_lH4oXGeSJ4E0xro


Then wire it in features/editor/ui/FontSelector.tsx.

🧭 Repository structure (high level)
src/
├─ app/                     # Next.js app router (page/layout)
├─ features/
│  └─ editor/
│     ├─ components/        # UI building blocks (CanvasStage, Panels, etc.)
│     ├─ hooks/             # useEditorState, useCanvasInteractions, useCanvasEditor
│     ├─ lib/               # canvas drawing/metrics, types, fonts-db (IndexedDB)
│     ├─ state/             # constants (LS keys, limits, SNAP_PX)
│     ├─ ui/                # FontSelector + modal parts
│     └─ index.ts           # barrel exports
└─ styles/                  # global css (tailwind)

🏗️ Architecture overview

Rendering: HTML Canvas 2D; all drawing happens in features/editor/lib/canvas.ts via drawAll().

State:

useEditorState — source of truth (stage, nodes, bg, selection, history, autosave, export, reset).

useCanvasInteractions — pointer hit-testing, drag/move, rotate, resize, snapping, push history.

useCanvasEditor — orchestration hook wiring state + interactions + keyboard shortcuts & redraw.

Persistence:

Design autosave to localStorage (with 10-minute freshness).

Custom fonts in IndexedDB (features/editor/lib/fonts-db.ts).

Export: Offscreen canvas at the uploaded image’s natural width/height.

🧪 How to test (manual)

Upload image: Use a PNG. Canvas rescales for display but remembers natural size for export.

Add text: “Add Text Layer” → drag it around; snap guides appear at center.

Transform: Resize with side handles; rotate with top handle.

Layering: Duplicate layers; reorder by drag/drop; verify z-order changes.

History: Undo/redo via buttons or ⌘/Ctrl+Z, ⇧⌘/Ctrl+Z; check History panel.

Autosave & Reset: Refresh restores recent state; Reset clears everything.

Fonts: Select Google font; upload and manage custom fonts.

Export: Export PNG; dimensions should match original upload.

🧰 Tech choices & trade-offs

Canvas 2D (not SVG/fabric.js): Full control, minimal dependencies; manual transforms & hit-testing.

Snapshot history: Simple semantics; capped at 40 for memory balance.

Autosave with freshness window: Prevents stale restores; capped by localStorage limits.

Custom fonts: Stored persistently; can’t be unloaded during session.

✅ Bonus points implemented

Snap-to-center with guides

Export at original dimensions

Resize, rotate, drag layers

Drag-and-drop layer reordering

Undo/redo with history panel

Autosave + Reset

Custom font upload (TTF/OTF/WOFF/WOFF2)

⚠️ Known limitations

Only PNG supported as background

No zoom/pan

No multi-select/group transforms

Approx text metrics (letter-spacing, wrap)

Limited touch UX

Snapshot-based history

📝 Scripts
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}


👤 Maintainers

Rahel Samson (@rahel-samson)


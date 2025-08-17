Here’s a drop-in **README.md** you can paste at the root of the repo. It covers setup, architecture, trade-offs, bonus points, and known limitations.

---

# Image Text Composer (Canvas 2D)

A lightweight, client-side image composer built with Next.js + React + TypeScript and the HTML Canvas 2D API.
Add text layers to a PNG, drag/resize/rotate with snapping guides, reorder layers, and export a PNG at the original image’s resolution. Includes autosave, undo/redo history, and custom font upload (TTF/OTF/WOFF/WOFF2).

---

## ✨ Features

* **Canvas UX**

  * Drag to move; **snap-to-center** with purple vertical/horizontal guides
  * **Resize** via side handles (supports wrapping width)
  * **Rotate** via top handle (angle shown/controllable in panel)
* **Layer management**

  * Select, duplicate, lock, toggle visibility
  * **Drag-and-drop reordering** (with drop indicator)
  * Bring forward / send backward buttons
* **Text styling**

  * Font family (Google Fonts + **custom upload**)
  * Size, weight, color, opacity
  * Alignment (left/center/right)
  * Line height, letter spacing
  * Shadow (color, blur, offsets)
* **History & persistence**

  * **Undo/redo** (40 snapshots) with visible History panel
  * **Autosave** to `localStorage` (restores after refresh; 10-minute freshness window)
  * **Reset** button clears state and storage
* **Export**

  * **Preserves original image dimensions** (renders to offscreen canvas at natural size)
* **Keyboard shortcuts**

  * ⌫/Del delete, ⌘/Ctrl+D duplicate, ⌘/Ctrl+Z / ⇧⌘/Ctrl+Z undo/redo, arrows nudge (⇧ = 10px)

---

## 🚀 Quick start

### Prereqs

* Node.js ≥ 18
* pnpm **or** yarn **or** npm

### Install & run

```bash
# clone your public repo, then:
pnpm install       # or: yarn / npm install
pnpm dev           # or: yarn dev / npm run dev

# open http://localhost:3000
```

### Build

```bash
pnpm build && pnpm start   # Next.js production build
```

### Optional: Google Web Fonts API key

The demo uses a hard-coded key for convenience. For production, put your key in an env var and wire it in `features/editor/ui/FontSelector.tsx`.

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=xxxx_your_key_xxxx
```

---

## 🧭 Repository structure (high level)

```
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
```

> The editor is implemented as a **feature module** (folder-by-feature), separating stateful hooks from pure canvas utilities and presentational components.

---

## 🏗️ Architecture overview

* **Rendering:** HTML Canvas 2D; all drawing happens in `features/editor/lib/canvas.ts` via `drawAll()`.

  * Text measurement, letter spacing, wrapping, selection marquee/handles, and snap guides are handled here.
* **State:** React state + custom hooks:

  * `useEditorState` — single source of truth (stage, nodes, bg, selection, history, autosave, export, reset).
  * `useCanvasInteractions` — pointer hit-testing (body/handles), drag/move, rotate, resize, snapping, and pushing history.
  * `useCanvasEditor` — orchestration hook that combines state + interactions and wires keyboard shortcuts & redraw.
* **Persistence:**

  * **Design autosave** via `localStorage` (state + history + timestamp); 10-minute retention window to avoid stale restores.
  * **Custom fonts** via IndexedDB (`features/editor/lib/fonts-db.ts`). On boot, we restore all saved faces into `document.fonts`.
* **Export:** Offscreen canvas at the uploaded image’s **natural width/height**. We render the full scene there and download a PNG.

---

## 🧪 How to test (manual)

1. **Upload image:** Use a **PNG**. Canvas resizes the display but remembers the image’s natural size for export.
2. **Add text:** “Add Text Layer” → drag it around.

   * Drag near the canvas center: it **snaps** and purple crosshair lines appear.
3. **Transform:**

   * **Resize** using left/right handles (text wraps when box width > 0).
   * **Rotate** using the top handle; verify angle in the control panel updates.
4. **Layering:**

   * Duplicate the layer; drag rows in the Layers panel to reorder (purple drop indicator).
   * Confirm “Bring forward/Send backward” also change z-order.
5. **History:**

   * Make a series of changes; use Undo/Redo buttons and keyboard shortcuts.
   * Open the **History** panel and jump between snapshots.
6. **Autosave & Reset:**

   * Refresh the page — state restores (if within the 10-minute freshness window).
   * Click **Reset** — everything clears; refresh shows a blank editor.
7. **Fonts:**

   * Change Google font; hover in the selector to preview.
   * **Upload custom font** (TTF/OTF/WOFF/WOFF2) → fill modal → save. It appears under “Custom fonts”.
   * Delete a custom font; confirm behavior if it was selected.
8. **Export:**

   * Click **Export**. Inspect the PNG; dimensions should match the original upload’s natural size.

---

## 🧰 Tech choices & trade-offs

* **Next.js + React + TS:** Fast DX, strict typing, file-based routing. All editing is client-side.
* **Canvas 2D (not SVG/fabric.js):**

  * ✅ Full control, tiny footprint, no heavy runtime dependencies.
  * ⚠️ Manual hit-testing & transforms; more code, but predictable performance.
* **Snapshot history in memory (max 40):**

  * ✅ Simple, reliable undo/redo semantics.
  * ⚠️ Memory grows with snapshot size; for very large images we cap history length.
* **Autosave to `localStorage` with freshness window:**

  * ✅ “It just works” restore UX and avoids reopening stale canvases.
  * ⚠️ Large designs can push storage limits; we debounce writes and cap history.
* **Custom fonts via IndexedDB + CSS Font Loading:**

  * ✅ Survives refreshes; no server required.
  * ⚠️ Removal from `document.fonts` isn’t available; we simply stop listing it and fall back next session.

---

## ✅ Bonus points implemented

* Snap-to-center with visible purple guides (horizontal & vertical)
* Export at the image’s original dimensions (offscreen render)
* Transform tools: move, **resize with handles**, **rotate**
* Layer management: **drag-and-drop reordering**
* Undo/Redo (≥ 20 steps) with a visible history panel & snapshot jump
* Autosave + Reset to blank state
* **Custom font upload** (TTF/OTF/WOFF/WOFF2) with persistence

---

## ⚠️ Known limitations / future work

* **Image formats:** Only PNG upload is supported right now.
* **No zoom/pan** of the canvas yet (would help precision work).
* **No multi-select** or group transforms.
* **Approx text metrics:** Letter-spacing & wrap use canvas measurements; real kerning varies per font.
* **Mobile/touch gestures:** Basic pointer events work, but dedicated touch UX (pinch-zoom/rotate) isn’t implemented.
* **History model:** Snapshot-based; an operation log would be more memory-efficient for very large projects.
* **Custom fonts:** Cannot unload from `document.fonts` in the current session; deletion hides from the UI and future sessions.

---

## 📝 Scripts

```jsonc
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

---

## 📄 License

MIT — see `LICENSE` (or update to your preferred license).

---

## 👤 Maintainers

* Your Name (@your-handle)

---

If you want me to tailor the README to your exact repo name, CI badges, or a different env-var wiring for the Google Fonts API, say the word and I’ll tweak the text accordingly.

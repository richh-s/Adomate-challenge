// Lightweight IndexedDB helper for custom fonts.
// Stores the raw Blob and minimal metadata, reloads them into document.fonts on boot.

export type CustomFontRecord = {
    id: string;         // uuid
    family: string;     // CSS family to use in ctx.font / CSS
    style: string;      // 'normal' | 'italic' etc.
    weight: string;     // '400' | '700' etc.
    sourceName: string; // original file name
    blob: Blob;         // TTF/OTF/WOFF/WOFF2
  };
  
  const DB_NAME = "itc-fonts";
  const STORE = "fonts";
  const DB_VERSION = 1;
  
  /**
   * Open the DB and run an async operation. Always closes the DB.
   * fn MUST return a Promise<T> for type-safety.
   */
  function withDB<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
  
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
  
      req.onerror = () => reject(req.error);
  
      req.onsuccess = () => {
        const db = req.result;
        fn(db).then(
          (val) => {
            try { db.close(); } catch {}
            resolve(val);
          },
          (err) => {
            try { db.close(); } catch {}
            reject(err);
          }
        );
      };
    });
  }
  
  export function listFonts(): Promise<CustomFontRecord[]> {
    return withDB<CustomFontRecord[]>((db) =>
      new Promise<CustomFontRecord[]>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const st = tx.objectStore(STORE);
        const req = st.getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result as CustomFontRecord[]);
      })
    );
  }
  
  export function deleteFont(id: string): Promise<void> {
    return withDB<void>((db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const st = tx.objectStore(STORE);
        const req = st.delete(id);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      })
    );
  }
  
  export async function saveFont(
    file: File,
    opts?: { family?: string; style?: string; weight?: string }
  ): Promise<CustomFontRecord> {
    const family =
      (opts?.family ?? file.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "")).trim() ||
      "CustomFont";
    const style = opts?.style ?? "normal";
    const weight = opts?.weight ?? "400";
    const blob = new Blob([await file.arrayBuffer()], { type: file.type || "font/ttf" });
  
    const rec: CustomFontRecord = {
      id: crypto.randomUUID(),
      family,
      style,
      weight,
      sourceName: file.name,
      blob,
    };
  
    await withDB<void>((db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const st = tx.objectStore(STORE);
        const req = st.add(rec);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      })
    );
  
    return rec;
  }
  
  // Load a stored font into CSS Font Loading
  export async function loadFontIntoDocument(rec: CustomFontRecord): Promise<FontFace> {
    const ab = await rec.blob.arrayBuffer();
    const face = new FontFace(rec.family, ab, { style: rec.style, weight: rec.weight });
    await face.load();
    (document as any).fonts?.add(face);
    try {
      await (document as any).fonts?.load?.(`${rec.weight} 16px "${rec.family}"`);
    } catch {}
    return face;
  }
  
  // Reload all custom fonts on boot
  export async function restoreCustomFonts(): Promise<CustomFontRecord[]> {
    const fonts = await listFonts();
    await Promise.all(fonts.map(loadFontIntoDocument));
    return fonts;
  }
  
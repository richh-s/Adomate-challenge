"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Upload, Trash2, HardDriveDownload } from "lucide-react";
import {
  restoreCustomFonts, saveFont, deleteFont, loadFontIntoDocument,
  type CustomFontRecord
} from "../lib/fonts-db";

interface FontSelectorProps {
  value?: string;
  onChange: (fontFamily: string) => void;
}

const API_KEY = "AIzaSyClJb5bio8gEWF3KWs_lH4oXGeSJ4E0xro"; // your key

const FALLBACK_FONTS = [
  "Open Sans","Roboto","Lato","Montserrat","Oswald","Raleway","Playfair Display","Merriweather",
  "Poppins","Source Sans Pro","Ubuntu","Nunito","Rubik","Work Sans","Dancing Script","Pacifico","Caveat","Satisfy"
];

type WebfontItem = { family: string };
type WebfontResponse = { items?: WebfontItem[] };

const FontSelector: React.FC<FontSelectorProps> = ({ value = "Open Sans", onChange }) => {
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [familiesRemote, setFamiliesRemote] = useState<string[]>(FALLBACK_FONTS);

  // Custom fonts persisted locally
  const [customFonts, setCustomFonts] = useState<CustomFontRecord[]>([]);

  // Loaded map for hover/preview
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // fetch google families (client)
  useEffect(() => {
    const url = `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${API_KEY}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: WebfontResponse) => {
        const list = (d.items ?? []).map((it) => it.family);
        if (list.length) setFamiliesRemote(list);
      })
      .catch(() => {});
  }, []);

  // restore custom fonts from IndexedDB into document.fonts on boot
  useEffect(() => {
    (async () => {
      try {
        const recs = await restoreCustomFonts();
        setCustomFonts(recs);
        // mark loaded
        const m: Record<string, boolean> = {};
        for (const r of recs) m[r.family] = true;
        setLoaded((prev) => ({ ...prev, ...m }));
      } catch {}
    })();
  }, []);

  // typed access to document.fonts
  const docFonts: FontFaceSet | undefined = (typeof document !== "undefined"
    ? (document as Document & { fonts?: FontFaceSet }).fonts
    : undefined);

  // lazy-load a Google family
  const ensureLoaded = useMemo(
    () => async (family: string) => {
      if (loaded[family]) return;
      const id = `gf-${family.replace(/\s+/g, "-")}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        const weights = "300;400;500;600;700";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${weights}&display=swap`;
        document.head.appendChild(link);
      }
      try {
        await docFonts?.load?.(`400 1rem ${family}`);
      } finally {
        setLoaded((m) => ({ ...m, [family]: true }));
      }
    },
    [loaded, docFonts]
  );

  // sync prop
  useEffect(() => {
    setSelected(value);
    void ensureLoaded(value);
  }, [value, ensureLoaded]);

  // pre-load page chunk for previews
  useEffect(() => {
    if (!open) return;
    familiesRemote.slice(0, 20).forEach((f) => void ensureLoaded(f));
  }, [open, familiesRemote, ensureLoaded]);

  // computed lists with filter + sections
  const remoteFiltered = familiesRemote.filter((f) => f.toLowerCase().includes(query.toLowerCase()));
  const customFiltered = customFonts.filter((cf) => cf.family.toLowerCase().includes(query.toLowerCase()));

  // Upload flow
  const onPickFile = () => fileInputRef.current?.click();
  const onFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(file.name)) {
      alert("Please choose a TTF, OTF, WOFF, or WOFF2 file.");
      return;
    }

    const suggested = file.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "");
    const family = window.prompt("Font family name to use in the editor:", suggested) || suggested;
    const weight = window.prompt("Weight (e.g. 400, 700):", "400") || "400";
    const style = "normal";

    try {
      const rec = await saveFont(file, { family, weight, style });
      await loadFontIntoDocument(rec);

      setCustomFonts((prev) => [...prev, rec]);
      setLoaded((m) => ({ ...m, [rec.family]: true }));

      // Select it immediately
      setSelected(rec.family);
      onChange(rec.family);
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert("Could not save that font.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete a custom font
  const onRemoveCustom = async (id: string) => {
    const rec = customFonts.find((f) => f.id === id);
    if (!rec) return;
    if (!confirm(`Remove custom font "${rec.family}"?`)) return;
    try {
      await deleteFont(id);
      setCustomFonts((prev) => prev.filter((f) => f.id !== id));
      // Note: FontFaceSet has no remove(); leave it for this session.
      if (selected === rec.family) {
        setSelected("Open Sans");
        onChange("Open Sans");
      }
    } catch (e) {
      console.error(e);
      alert("Could not remove that font.");
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Font Family</label>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      <div className="relative">
        <button
          type="button"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white flex justify-between items-center"
          onClick={() => setOpen((v) => !v)}
          style={{ fontFamily: selected }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate">{selected}</span>
          <ChevronDown size={18} />
        </button>

        {open && (
          <div
            className="absolute z-10 mt-1 w-full max-h-80 overflow-auto bg-gray-800 border border-gray-600 rounded shadow-lg"
            role="listbox"
          >
            {/* search + actions */}
            <div className="sticky top-0 flex items-center gap-2 bg-gray-800 p-2 border-b border-gray-700">
              <Search size={16} className="opacity-70" />
              <input
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Search fonts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                onClick={onPickFile}
                title="Upload custom font"
              >
                <Upload size={14} /> Upload
              </button>
            </div>

            {/* Custom section */}
            {customFiltered.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400 flex items-center gap-1">
                  <HardDriveDownload size={12} /> Custom fonts
                </div>
                {customFiltered.map((cf) => (
                  <div key={cf.id} className="flex items-center">
                    <button
                      type="button"
                      role="option"
                      aria-selected={cf.family === selected}
                      className="flex-1 text-left px-3 py-2 hover:bg-gray-700"
                      style={{ fontFamily: loaded[cf.family] ? `"${cf.family}", inherit` : "inherit" }}
                      onClick={async () => {
                        // ensure it's live in the document (should already be)
                        try { await loadFontIntoDocument(cf); } catch {}
                        setLoaded((m) => ({ ...m, [cf.family]: true }));
                        setSelected(cf.family);
                        setOpen(false);
                        onChange(cf.family);
                      }}
                    >
                      {cf.family} <span className="ml-1 text-xs text-gray-400">(local)</span>
                    </button>
                    <button
                      className="px-2 text-gray-300 hover:text-red-400"
                      title="Remove custom font"
                      onClick={() => onRemoveCustom(cf.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="border-t border-gray-700 my-1" />
              </>
            )}

            {/* Google / fallback section */}
            {remoteFiltered.map((font) => (
              <button
                key={font}
                type="button"
                role="option"
                aria-selected={font === selected}
                className="w-full text-left px-3 py-2 hover:bg-gray-700"
                style={{ fontFamily: loaded[font] ? font : "inherit" }}
                onMouseEnter={() => void ensureLoaded(font)}
                onClick={async () => {
                  await ensureLoaded(font);
                  setSelected(font);
                  setOpen(false);
                  onChange(font);
                }}
              >
                {font}
              </button>
            ))}

            {remoteFiltered.length === 0 && customFiltered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-300">No results.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSelector;

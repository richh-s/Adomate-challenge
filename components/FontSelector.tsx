"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface FontSelectorProps {
  value?: string;
  onChange: (fontFamily: string) => void;
}

const API_KEY = "AIzaSyClJb5bio8gEWF3KWs_lH4oXGeSJ4E0xro"; // using your key

const FALLBACK_FONTS = [
  "Open Sans","Roboto","Lato","Montserrat","Oswald","Raleway","Playfair Display","Merriweather",
  "Poppins","Source Sans Pro","Ubuntu","Nunito","Rubik","Work Sans","Dancing Script","Pacifico","Caveat","Satisfy"
];

type WebfontItem = { family: string; variants?: string[]; category?: string };
type WebfontResponse = { items?: WebfontItem[] };

const FontSelector: React.FC<FontSelectorProps> = ({ value = "Open Sans", onChange }) => {
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [families, setFamilies] = useState<string[]>(FALLBACK_FONTS);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  // fetch all families on the client
  useEffect(() => {
    const url = `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${API_KEY}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: WebfontResponse) => {
        const list = (d.items ?? []).map((it) => it.family);
        if (list.length) setFamilies(list);
      })
      .catch(() => {
        // keep fallback list on error
      });
  }, []);

  // typed access to document.fonts
  const docFonts: FontFaceSet | undefined = (typeof document !== "undefined"
    ? (document as Document & { fonts?: FontFaceSet }).fonts
    : undefined);

  // lazy-load a single family from Google Fonts CSS2 endpoint
  const ensureLoaded = useMemo(
    () => async (family: string) => {
      if (loaded[family]) return;

      const id = `gf-${family.replace(/\s+/g, "-")}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        // tweak weights if you need fewer/more:
        const weights = "300;400;500;600;700";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(
          /%20/g,
          "+"
        )}:wght@${weights}&display=swap`;
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

  // keep selected in sync if prop changes
  useEffect(() => {
    setSelected(value);
    // pre-load initial font
    void ensureLoaded(value);
  }, [value, ensureLoaded]);

  // when menu opens, prefetch first page for nicer previews
  useEffect(() => {
    if (!open) return;
    families.slice(0, 20).forEach((f) => void ensureLoaded(f));
  }, [open, families, ensureLoaded]);

  const filtered = families.filter((f) => f.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Font Family</label>
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
            className="absolute z-10 mt-1 w-full max-h-72 overflow-auto bg-gray-800 border border-gray-600 rounded shadow-lg"
            role="listbox"
          >
            {/* search bar */}
            <div className="sticky top-0 flex items-center gap-2 bg-gray-800 p-2 border-b border-gray-700">
              <Search size={16} className="opacity-70" />
              <input
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Search fonts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filtered.map((font) => (
              <button
                key={font}
                type="button"
                role="option"
                aria-selected={font === selected}
                className="w-full text-left px-3 py-2 hover:bg-gray-700"
                style={{ fontFamily: loaded[font] ? font : "inherit" }}
                onMouseEnter={() => void ensureLoaded(font)} // preview on hover
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

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-300">No results.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSelector;

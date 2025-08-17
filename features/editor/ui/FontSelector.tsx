"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, HardDriveDownload } from "lucide-react";
import SearchBar from "./Parts/SearchBar";
import FontRow from "./Parts/FontRow";
import UploadFontModal from "./Parts/UploadFontModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

import {
  restoreCustomFonts,
  saveFont,
  deleteFont,
  loadFontIntoDocument,
  type CustomFontRecord,
} from "../lib/fonts-db"; 

interface FontSelectorProps {
  value?: string;
  onChange: (fontFamily: string) => void;
}

const API_KEY = "AIzaSyClJb5bio8gEWF3KWs_lH4oXGeSJ4E0xro"; // Google Webfonts API key

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

  const [customFonts, setCustomFonts] = useState<CustomFontRecord[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CustomFontRecord | null>(null);

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

  // restore custom fonts on boot
  useEffect(() => {
    (async () => {
      try {
        const recs = await restoreCustomFonts();
        setCustomFonts(recs);
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

  // pre-load when menu opens
  useEffect(() => {
    if (!open) return;
    familiesRemote.slice(0, 20).forEach((f) => void ensureLoaded(f));
  }, [open, familiesRemote, ensureLoaded]);

  const remoteFiltered = familiesRemote.filter((f) =>
    f.toLowerCase().includes(query.toLowerCase())
  );
  const customFiltered = customFonts.filter((cf) =>
    cf.family.toLowerCase().includes(query.toLowerCase())
  );

  // Upload flow (modal-based)
  const onPickFile = () => fileInputRef.current?.click();
  const onFiles = async (files: FileList | null) => {
    setUploadError(null);
    if (!files || !files[0]) return;
    const file = files[0];
    if (!/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(file.name)) {
      setPendingFile(null);
      setUploadError("Please choose a TTF, OTF, WOFF, or WOFF2 file.");
      setUploadOpen(true);
      return;
    }
    setPendingFile(file);
    setUploadOpen(true);
  };

  const onUploadSubmit = async (vals: { family: string; weight: string; style: "normal" | "italic" }) => {
    setUploadError(null);
    const file = pendingFile;
    if (!file) return;

    try {
      const rec = await saveFont(file, vals);
      await loadFontIntoDocument(rec);

      setCustomFonts((prev) => [...prev, rec]);
      setLoaded((m) => ({ ...m, [rec.family]: true }));

      setSelected(rec.family);
      onChange(rec.family);
      setOpen(false);
      setUploadOpen(false);
      setPendingFile(null);
    } catch (e) {
      console.error(e);
      setUploadError("Could not save that font.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete (modal-based)
  const confirmDelete = (rec: CustomFontRecord) => {
    setToDelete(rec);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    const rec = toDelete;
    if (!rec) return;
    try {
      await deleteFont(rec.id);
      setCustomFonts((prev) => prev.filter((f) => f.id !== rec.id));
      if (selected === rec.family) {
        setSelected("Open Sans");
        onChange("Open Sans");
      }
    } catch (e) {
      console.error(e);
      // Optional: add an error toast if you want
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
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
            <SearchBar query={query} setQuery={setQuery} onUploadClick={onPickFile} />

            {customFiltered.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-gray-400 flex items-center gap-1">
                  <HardDriveDownload size={12} /> Custom fonts
                </div>
                {customFiltered.map((cf) => (
                  <FontRow
                    key={cf.id}
                    label={
                      <>
                        {cf.family}{" "}
                        <span className="ml-1 text-xs text-gray-400">(local)</span>
                      </> as any
                    }
                    isSelected={cf.family === selected}
                    onClick={async () => {
                      try { await loadFontIntoDocument(cf); } catch {}
                      setLoaded((m) => ({ ...m, [cf.family]: true }));
                      setSelected(cf.family);
                      setOpen(false);
                      onChange(cf.family);
                    }}
                    showDelete
                    onDelete={() => confirmDelete(cf)}
                    fontFamily={loaded[cf.family] ? cf.family : undefined}
                  />
                ))}
                <div className="border-t border-gray-700 my-1" />
              </>
            )}

            {remoteFiltered.map((font) => (
              <FontRow
                key={font}
                label={font}
                isSelected={font === selected}
                onClick={async () => {
                  // ensure Google face is loaded
                  const id = `gf-${font.replace(/\s+/g, "-")}`;
                  if (!document.getElementById(id)) {
                    const link = document.createElement("link");
                    link.id = id;
                    link.rel = "stylesheet";
                    const weights = "300;400;500;600;700";
                    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@${weights}&display=swap`;
                    document.head.appendChild(link);
                  }
                  try {
                    await (document as any).fonts?.load?.(`400 1rem ${font}`);
                  } catch {}
                  setLoaded((m) => ({ ...m, [font]: true }));
                  setSelected(font);
                  setOpen(false);
                  onChange(font);
                }}
                fontFamily={loaded[font] ? font : undefined}
              />
            ))}

            {remoteFiltered.length === 0 && customFiltered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-300">No results.</div>
            )}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <UploadFontModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setPendingFile(null);
          setUploadError(null);
        }}
        file={pendingFile}
        defaultFamily={pendingFile?.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "")}
        onSubmit={onUploadSubmit}
        error={uploadError}
      />

      {/* Confirm delete modal */}
      <ConfirmDeleteModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        fontFamily={toDelete?.family}
      />
    </div>
  );
};

export default FontSelector;

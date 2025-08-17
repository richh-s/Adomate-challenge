"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface FontSelectorProps {
  value?: string;
  onChange: (fontFamily: string) => void;
}

const GOOGLE_FONTS = [
  "Open Sans","Roboto","Lato","Montserrat","Oswald","Raleway","Playfair Display","Merriweather",
  "Poppins","Source Sans Pro","Ubuntu","Nunito","Rubik","Work Sans","Dancing Script","Pacifico","Caveat","Satisfy"
];

const FontSelector: React.FC<FontSelectorProps> = ({ value = "Open Sans", onChange }) => {
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<string[]>([]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(f => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`;
    document.head.appendChild(link);
    (async () => {
      try {
        await (document as any).fonts?.ready;
        setLoaded(GOOGLE_FONTS);
      } catch {
        setLoaded(GOOGLE_FONTS);
      }
    })();
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Font Family</label>
      <div className="relative">
        <button
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white flex justify-between items-center"
          onClick={() => setOpen(!open)}
          style={{ fontFamily: selected }}
        >
          <span>{selected}</span>
          <ChevronDown size={18} />
        </button>
        {open && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-gray-800 border border-gray-600 rounded shadow-lg">
            {loaded.map((font) => (
              <button
                key={font}
                className="w-full text-left px-3 py-2 hover:bg-gray-700"
                style={{ fontFamily: font }}
                onClick={() => {
                  setSelected(font);
                  setOpen(false);
                  onChange(font);
                }}
              >
                {font}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FontSelector;

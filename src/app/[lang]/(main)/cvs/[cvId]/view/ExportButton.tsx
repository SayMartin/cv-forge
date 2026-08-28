"use client";

import { useDictionary } from "@/i18n/DictionaryProvider";

export function ExportButton({ cvName }: { cvName: string }) {
  const { exportPdf } = useDictionary().editor.view;

  function handlePrint() {
    const prev = document.title;
    document.title = cvName;
    window.print();
    document.title = prev;
  }

  return (
    <button
      onClick={handlePrint}
      className="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
    >
      {exportPdf}
    </button>
  );
}

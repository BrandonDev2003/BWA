"use client";

type Props = {
  onSelect: (sticker: string) => void;
};

export default function StickerPanel({ onSelect }: Props) {
  const stickers = ["😀", "🔥", "❤️", "😂", "👍"];

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-2 shadow-md">
      <div className="flex gap-3 flex-wrap">
        {stickers.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(s)}
            className="text-3xl bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-200 transition"
          >
            {s}
          </button>
        ))}

        <button
          type="button"
          className="bg-white border-2 border-dashed border-gray-400 rounded-md p-2 text-sm text-gray-600 hover:bg-gray-200"
        >
          + Crear sticker
        </button>
      </div>
    </div>
  );
}

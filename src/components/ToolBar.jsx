export function ToolBar({ onUndo, onClear, onFinish, isClosed, hasPoints }) {
  return (
    <>
      {/* Desktop: toolbar horizontal di atas kanvas */}
      <div className="hidden md:flex items-center gap-3 mb-3">
        <button
          onClick={onUndo}
          disabled={!hasPoints}
          className="px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-white/60 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          ↩ Undo
        </button>
        <button
          onClick={onClear}
          disabled={!hasPoints}
          className="px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-white/60 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Hapus Semua
        </button>
        <div className="flex-1" />
        <button
          onClick={onFinish}
          disabled={!isClosed}
          className="px-6 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Selesai Menggambar →
        </button>
      </div>

      {/* Mobile: floating action bar di bawah layar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom">
        <button
          onClick={onUndo}
          disabled={!hasPoints}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 active:bg-gray-100 disabled:opacity-40"
        >
          ↩ Undo
        </button>
        <button
          onClick={onClear}
          disabled={!hasPoints}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 active:bg-gray-100 disabled:opacity-40"
        >
          Hapus
        </button>
        <button
          onClick={onFinish}
          disabled={!isClosed}
          className="flex-[2] py-3 rounded-xl bg-green-700 text-white text-sm font-semibold active:bg-green-800 disabled:opacity-40"
        >
          Selesai →
        </button>
      </div>
    </>
  );
}

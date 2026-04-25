function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function RABTable({ items, grandTotal }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-green-800 text-white">
            <th className="text-left p-3 font-semibold">Uraian Pekerjaan</th>
            <th className="text-right p-3 font-semibold">Vol.</th>
            <th className="text-center p-3 font-semibold">Sat.</th>
            <th className="text-right p-3 font-semibold">Harga Satuan</th>
            <th className="text-right p-3 font-semibold">Jumlah (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.uraian} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="p-3 text-gray-800">{item.uraian}</td>
              <td className="p-3 text-right font-mono text-gray-700">{item.vol.toFixed(2)}</td>
              <td className="p-3 text-center text-gray-500">{item.sat}</td>
              <td className="p-3 text-right font-mono text-gray-700">{formatRp(item.hargaSatuan)}</td>
              <td className="p-3 text-right font-mono font-semibold text-gray-800">
                {formatRp(item.jumlah)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-green-50 border-t-2 border-green-300">
            <td colSpan={4} className="p-3 font-bold text-green-900 text-sm">
              GRAND TOTAL
            </td>
            <td className="p-3 text-right font-bold text-green-900 font-mono text-base">
              {formatRp(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

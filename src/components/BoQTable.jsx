export function BoQTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-green-800 text-white">
            <th className="text-left p-3 font-semibold">Uraian Material</th>
            <th className="text-right p-3 font-semibold">Kuantitas</th>
            <th className="text-left p-3 font-semibold pl-2">Sat.</th>
            <th className="text-left p-3 font-semibold">Kategori</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="p-3 text-gray-800">{item.label}</td>
              <td className="p-3 text-right font-mono text-gray-800">
                {item.kuantitas.toLocaleString('id-ID')}
              </td>
              <td className="p-3 pl-2 text-gray-500">{item.satuan}</td>
              <td className="p-3 text-xs text-gray-400">{item.kategori}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';

const GREEN = ['#0E4D2B', '#166B3D', '#2FA24F', '#7CCB6D', '#B8E4C4'];

function formatRp(val) {
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} jt`;
  return `Rp ${(val / 1_000).toFixed(0)} rb`;
}

// Label % di dalam slice pie
function PieInnerLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const rad = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * rad);
  const y = cy + r * Math.sin(-midAngle * rad);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// Tooltip custom agar tampil rapi
function RabTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p className="text-green-700 font-bold">Rp {d.value.toLocaleString('id-ID')}</p>
    </div>
  );
}

function CarbonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-green-700 font-bold">{payload[0].value} kg CO₂e</p>
    </div>
  );
}

export function ChartSection({ rabResult, carbonResult }) {
  const rabData = rabResult.items.map(item => ({
    name: item.uraian.replace('Pek. ', ''),
    value: item.jumlah,
  }));

  const carbonData = carbonResult.detail
    .filter(d => d.kgCO2e > 0)
    .map(d => ({ name: d.label, co2: d.kgCO2e }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Visualisasi Data</h2>
        <p className="text-xs text-gray-400 mt-0.5">Distribusi biaya dan jejak karbon per kategori</p>
      </div>

      <div className="p-6 space-y-10">

        {/* ── Donut Chart: Proporsi Biaya RAB ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">Proporsi Biaya RAB</h3>
          <p className="text-xs text-gray-400 mb-4">Persentase biaya setiap item pekerjaan</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={rabData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={115}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={PieInnerLabel}
              >
                {rabData.map((_, i) => (
                  <Cell key={i} fill={GREEN[i % GREEN.length]} />
                ))}
              </Pie>
              <Tooltip content={<RabTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => (
                  <span className="text-xs text-gray-600">{val}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ── Bar Chart: Embodied Carbon per Material ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-1">Embodied Carbon per Material</h3>
          <p className="text-xs text-gray-400 mb-4">Emisi kg CO₂e yang dikontribusikan setiap material</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={carbonData}
              margin={{ top: 5, right: 10, left: 10, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickFormatter={v => `${v}`}
                unit=" kg"
              />
              <Tooltip content={<CarbonTooltip />} />
              <Bar dataKey="co2" radius={[5, 5, 0, 0]}>
                {carbonData.map((_, i) => (
                  <Cell key={i} fill={GREEN[i % GREEN.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

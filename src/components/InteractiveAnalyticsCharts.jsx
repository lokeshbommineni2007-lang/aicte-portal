import React, { useState } from 'react';
import { TrendingUp, Layers, Clock, Download, Printer, Filter, Info, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function InteractiveAnalyticsCharts({
  cases,
  institutions,
  onExportCSV,
  onOpenExecutiveReport,
  onSelectAgeingFilter
}) {
  const [activeMetric, setActiveMetric] = useState('both');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 6-Month Trend Data (June - Nov 2026)
  const trendData = [
    { month: 'Jun 2026', intake: 14, disposed: 12, rate: '86%' },
    { month: 'Jul 2026', intake: 22, disposed: 19, rate: '86%' },
    { month: 'Aug 2026', intake: 35, disposed: 28, rate: '80%' },
    { month: 'Sep 2026', intake: 48, disposed: 41, rate: '85%' },
    { month: 'Oct 2026', intake: 62, disposed: 54, rate: '87%' },
    { month: 'Nov 2026', intake: 76, disposed: 70, rate: '92%' }
  ];

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;
  const maxVal = 90;

  // Generate SVG points
  const intakePoints = trendData.map((d, i) => {
    const x = paddingX + (i / (trendData.length - 1)) * plotWidth;
    const y = svgHeight - paddingY - (d.intake / maxVal) * plotHeight;
    return { x, y, data: d };
  });

  const disposedPoints = trendData.map((d, i) => {
    const x = paddingX + (i / (trendData.length - 1)) * plotWidth;
    const y = svgHeight - paddingY - (d.disposed / maxVal) * plotHeight;
    return { x, y, data: d };
  });

  const makePath = (pts) => {
    return pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = pts[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  };

  const makeAreaPath = (pts) => {
    const linePath = makePath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    const baseline = svgHeight - paddingY;
    return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  };

  // Bureau Split
  const rbCount = cases.filter(c => c.assignedBureau.includes('Regulation')).length;
  const pgrcCount = cases.filter(c => c.assignedBureau.includes('PGRC')).length;
  const vigCount = cases.filter(c => c.assignedBureau.includes('Vigilance')).length;
  const regCount = cases.filter(c => c.assignedBureau.includes('Regional')).length;
  const total = cases.length || 1;

  // Ageing Buckets
  const ageingBuckets = [
    { label: '0 to 15 Days', sub: 'Fresh Intake', count: 2, pct: 33, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30', filter: 'all' },
    { label: '16 to 30 Days', sub: 'Active Scrutiny', count: 2, pct: 33, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', filter: 'all' },
    { label: '31 to 45 Days', sub: 'Expiring Soon', count: 1, pct: 17, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', filter: 'critical' },
    { label: '45+ Days', sub: 'Critical SLA Breach', count: 1, pct: 17, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', filter: 'overdue' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner with One-Click Export Actions */}
      <div className="glass-panel p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-[#2f5bff]/20 text-[#2f5bff] border border-[#2f5bff]/30 px-2.5 py-0.5 rounded-full uppercase">
              AICTE REGULATORY METRICS ENGINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">APH 2026-27 COMPLIANT</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">Disposal Velocity, Ageing Buckets & Bureau Caseloads</h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Continuous empirical analytics driving transparency across CPGRAMS, state portals, and direct student appeals.
          </p>
        </div>

        {/* One-Click Export Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onExportCSV}
            className="px-4 py-2 text-xs font-mono font-bold bg-[#0d1627] hover:bg-[#14223d] text-white border border-white/15 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            title="Download RFC 4180 CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={onOpenExecutiveReport}
            className="px-4 py-2 text-xs font-mono font-bold bg-[#2f5bff] hover:bg-[#2548cc] text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            title="Generate printable executive briefing with official Government letterhead"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Executive Brief (PDF)</span>
          </button>
        </div>
      </div>

      {/* Grid: Interactive Trends Chart + Bureau Caseload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INTERACTIVE TRENDS CURVE (2 COLS) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Monthly Intake vs. Cases Disposed (June – November 2026)
              </h4>
              <span className="text-[10px] text-slate-400">Hover data points to inspect monthly clearance velocity</span>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center gap-1 bg-[#090f1f] p-1 rounded-xl border border-white/10 text-[10px] font-mono">
              <button
                onClick={() => setActiveMetric('both')}
                className={`px-2.5 py-1 rounded-lg transition-all ${activeMetric === 'both' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Combined
              </button>
              <button
                onClick={() => setActiveMetric('intake')}
                className={`px-2.5 py-1 rounded-lg transition-all ${activeMetric === 'intake' ? 'bg-blue-600/40 text-blue-300 font-bold border border-blue-500/40' : 'text-slate-400 hover:text-white'}`}
              >
                Intake
              </button>
              <button
                onClick={() => setActiveMetric('disposed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${activeMetric === 'disposed' ? 'bg-emerald-600/40 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
              >
                Disposed
              </button>
            </div>
          </div>

          {/* SVG CHART CONTAINER */}
          <div className="relative w-full overflow-hidden bg-[#070b16]/80 p-4 rounded-xl border border-white/5">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="disposedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 25, 50, 75].map(v => {
                const y = svgHeight - paddingY - (v / maxVal) * plotHeight;
                return (
                  <g key={v}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              {(activeMetric === 'both' || activeMetric === 'intake') && (
                <path d={makeAreaPath(intakePoints)} fill="url(#intakeGrad)" />
              )}
              {(activeMetric === 'both' || activeMetric === 'disposed') && (
                <path d={makeAreaPath(disposedPoints)} fill="url(#disposedGrad)" />
              )}

              {/* Curves */}
              {(activeMetric === 'both' || activeMetric === 'intake') && (
                <path
                  d={makePath(intakePoints)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
              {(activeMetric === 'both' || activeMetric === 'disposed') && (
                <path
                  d={makePath(disposedPoints)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data Markers */}
              {trendData.map((d, i) => {
                const ptIntake = intakePoints[i];
                const ptDisposed = disposedPoints[i];

                return (
                  <g key={i}>
                    {/* Month X Labels */}
                    <text
                      x={ptIntake.x}
                      y={svgHeight - 10}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {d.month.split(' ')[0]}
                    </text>

                    {/* Interactive Circles */}
                    {(activeMetric === 'both' || activeMetric === 'intake') && (
                      <circle
                        cx={ptIntake.x}
                        cy={ptIntake.y}
                        r="4.5"
                        fill="#070b16"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        className="cursor-pointer transition-transform hover:scale-150"
                        onMouseEnter={() => setHoveredPoint({ ...d, type: 'Intake', val: d.intake })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    )}

                    {(activeMetric === 'both' || activeMetric === 'disposed') && (
                      <circle
                        cx={ptDisposed.x}
                        cy={ptDisposed.y}
                        r="4.5"
                        fill="#070b16"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="cursor-pointer transition-transform hover:scale-150"
                        onMouseEnter={() => setHoveredPoint({ ...d, type: 'Disposed', val: d.disposed })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-4 right-4 bg-[#0c152a] border border-white/20 p-3 rounded-xl shadow-2xl text-xs pointer-events-none animate-in fade-in duration-150">
                <span className="font-mono text-[10px] text-slate-400 uppercase block">{hoveredPoint.month} Performance</span>
                <div className="mt-1 flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-blue-400 block">Total Intake:</span>
                    <span className="font-mono font-bold text-white text-sm">{hoveredPoint.intake}</span>
                  </div>
                  <div className="border-l border-white/10 pl-3">
                    <span className="text-[10px] text-emerald-400 block">Disposed:</span>
                    <span className="font-mono font-bold text-white text-sm">{hoveredPoint.disposed}</span>
                  </div>
                  <div className="border-l border-white/10 pl-3">
                    <span className="text-[10px] text-amber-400 block">Throughput:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{hoveredPoint.rate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> Total Intake
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Cases Disposed
              </span>
            </div>
            <span className="text-emerald-400 font-bold">▲ Current Monthly Disposal Rate: 92%</span>
          </div>
        </div>

        {/* BUREAU WORKLOAD SHARE (1 COL) */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2f5bff]" />
            Active Caseload by Bureau
          </h4>

          <div className="space-y-4 pt-1">
            {[
              { name: 'Regulation Bureau (RB)', count: rbCount, color: 'bg-blue-500', text: 'text-blue-400' },
              { name: 'PGRC Cell', count: pgrcCount, color: 'bg-[#ff5a2c]', text: 'text-[#ff5a2c]' },
              { name: 'Vigilance Cell', count: vigCount, color: 'bg-purple-500', text: 'text-purple-400' },
              { name: 'Regional Inspections', count: regCount, color: 'bg-amber-500', text: 'text-amber-400' }
            ].map((b, idx) => {
              const pct = Math.round((b.count / total) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 truncate max-w-[170px]">{b.name}</span>
                    <span className={`font-bold ${b.text}`}>{b.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#080d1a] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full ${b.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
            <span>Dual-tracking engine monitors continuous balance to prevent bureau overload.</span>
          </div>
        </div>

      </div>

      {/* SLA AGEING BUCKETS (CLICKABLE QUICK-FILTERS) */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ff5a2c]" />
            Statutory SLA Ageing Distribution (Click to Drilldown)
          </h4>
          <span className="text-[10px] font-mono text-slate-400">CPGRAMS 45-DAY COMPLIANCE WINDOW</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ageingBuckets.map((b, idx) => (
            <div
              key={idx}
              onClick={() => onSelectAgeingFilter(b.filter)}
              className={`p-4 rounded-xl border ${b.bg} hover:brightness-110 cursor-pointer transition-all flex flex-col justify-between shadow-lg`}
            >
              <div>
                <span className={`text-[10px] font-mono font-bold uppercase block ${b.color}`}>{b.sub}</span>
                <span className="text-sm font-bold text-white mt-1 block">{b.label}</span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-2xl font-mono font-black text-white">{b.count} cases</span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1 hover:text-white">
                  Filter <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

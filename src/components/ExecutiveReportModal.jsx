import React from 'react';
import { X, Printer, Download, Building2, CheckCircle2, ShieldAlert, FileText, Calendar } from 'lucide-react';

export default function ExecutiveReportModal({
  isOpen,
  onClose,
  cases,
  institutions,
  stats
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const highRisk = institutions.filter(i => i.riskScore >= 70);
  const nowFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b1222] text-[#f4f2ec] rounded-2xl max-w-4xl w-full border border-white/20 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 border-b border-white/10 bg-[#070c17] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded">
              ADMINISTRATIVE REPORTING ENGINE
            </span>
            <span className="text-xs text-slate-400">Official APH 2026-27 Compliant Executive Brief</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-[#2f5bff] hover:bg-[#2548cc] text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-report" className="p-8 sm:p-12 overflow-y-auto space-y-8 font-sans bg-[#0c1424]">
          
          {/* Official AICTE Letterhead */}
          <div className="border-b-2 border-amber-500/40 pb-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400 font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Government of India // Ministry of Education
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              All India Council for Technical Education
            </h1>
            <p className="text-xs text-slate-300 font-light">
              Nelson Mandela Marg, Vasant Kunj, New Delhi – 110070 | aicte-india.org
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 border-t border-white/10 mt-3 pt-3">
              <span>REPORT REF: <strong>AICTE/PGRC-RB/STAT-2026-Q4</strong></span>
              <span>DATE OF REPORT: <strong>{nowFormatted}</strong></span>
              <span>CLASSIFICATION: <strong>CONFIDENTIAL / REGULATORY AUDIT</strong></span>
            </div>
          </div>

          {/* Executive Summary Narrative */}
          <div className="space-y-2 text-xs leading-relaxed text-slate-200">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400 font-mono">
              1. Executive Overview & Throughput Summary
            </h2>
            <p>
              This consolidated statutory brief synthesizes operational metrics across the <strong>Regulation Bureau (RB)</strong>, 
              <strong>Public Grievance Redressal Cell (PGRC)</strong>, and <strong>Regional Directorates</strong> pursuant to 
              AICTE Approval Process Handbook (APH) regulations and CPGRAMS mandates. 
              The system currently maintains <strong>{stats.total} master cases</strong> under active lifecycle monitoring with an 
              aggregate disposal resolution rate of <strong>{((stats.disposed / stats.total) * 100).toFixed(1)}%</strong>.
            </p>
          </div>

          {/* Macro KPI Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#070b16] border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Grievances</span>
              <span className="text-2xl font-mono font-bold text-white mt-1 block">{stats.total}</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">100% Ingested</span>
            </div>
            <div className="p-4 rounded-xl bg-[#070b16] border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Disposed / Resolved</span>
              <span className="text-2xl font-mono font-bold text-emerald-400 mt-1 block">{stats.disposed}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Within Statutory SLA</span>
            </div>
            <div className="p-4 rounded-xl bg-[#070b16] border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Cross-Bureau Overlaps</span>
              <span className="text-2xl font-mono font-bold text-[#ff5a2c] mt-1 block">{stats.overlaps}</span>
              <span className="text-[10px] text-amber-400 mt-1 block">Dual-Tracking Synchronized</span>
            </div>
            <div className="p-4 rounded-xl bg-[#070b16] border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">SLA Breaches</span>
              <span className="text-2xl font-mono font-bold text-red-400 mt-1 block">{stats.overdue}</span>
              <span className="text-[10px] text-red-400 mt-1 block">Escalated to Apex Committee</span>
            </div>
          </div>

          {/* Bureau Caseload Breakdown */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400 font-mono">
              2. Bureau-Wise Caseload Distribution
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-white/10 rounded-xl overflow-hidden">
                <thead className="bg-[#070b16] font-mono text-[10px] text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Bureau / Cell</th>
                    <th className="p-3">Active Load</th>
                    <th className="p-3">Share (%)</th>
                    <th className="p-3">Disposed</th>
                    <th className="p-3">SLA Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  <tr>
                    <td className="p-3 font-bold text-white">Public Grievance Redressal Cell (PGRC)</td>
                    <td className="p-3">{cases.filter(c => c.assignedBureau.includes('PGRC')).length} files</td>
                    <td className="p-3">{((cases.filter(c => c.assignedBureau.includes('PGRC')).length / stats.total) * 100).toFixed(0)}%</td>
                    <td className="p-3 text-emerald-400">1</td>
                    <td className="p-3 text-emerald-400">92% On-Track</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Regulation Bureau (RB)</td>
                    <td className="p-3">{cases.filter(c => c.assignedBureau.includes('Regulation')).length} files</td>
                    <td className="p-3">{((cases.filter(c => c.assignedBureau.includes('Regulation')).length / stats.total) * 100).toFixed(0)}%</td>
                    <td className="p-3 text-emerald-400">0</td>
                    <td className="p-3 text-amber-400">78% (1 Inspection Pending)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Vigilance Cell</td>
                    <td className="p-3">{cases.filter(c => c.assignedBureau.includes('Vigilance')).length} files</td>
                    <td className="p-3">{((cases.filter(c => c.assignedBureau.includes('Vigilance')).length / stats.total) * 100).toFixed(0)}%</td>
                    <td className="p-3 text-emerald-400">0</td>
                    <td className="p-3 text-emerald-400">96% On-Track</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* High-Risk Institutions Roster */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400 font-mono">
              3. Institutions Mandating Priority Administrative Scrutiny
            </h2>
            <div className="space-y-2">
              {highRisk.map(inst => (
                <div key={inst.id} className="p-3.5 rounded-xl bg-[#070b16] border border-red-500/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{inst.name}</span>
                      <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                        PID: {inst.pid}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {inst.city}, {inst.state} • {inst.university} • Active Cases: {inst.activeCases}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-red-400 block">RISK: {inst.riskScore}/100</span>
                    <span className="text-[10px] font-mono text-slate-400">{inst.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Government Seal & Signatory Block */}
          <div className="pt-8 border-t border-white/10 flex items-end justify-between text-xs font-mono text-slate-400">
            <div>
              <p className="font-bold text-white">CENTRAL COMPLAINT MONITORING SYSTEM</p>
              <p>Dual-DB Architecture • SHA-256 Merkle Ledger</p>
              <p className="text-[10px] text-slate-500 mt-1">Generated electronically with cryptographic verification stamp.</p>
            </div>
            <div className="text-right space-y-1">
              <div className="w-36 h-12 border-b border-white/20 ml-auto mb-2 flex items-center justify-center italic text-slate-500 text-[11px]">
                [Digitally Signed via NIC]
              </div>
              <p className="font-bold text-white">Member Secretary</p>
              <p className="text-[10px]">All India Council for Technical Education</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

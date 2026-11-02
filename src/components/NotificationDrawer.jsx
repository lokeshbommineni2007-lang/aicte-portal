import React, { useState, useEffect } from 'react';
import { X, Bell, Smartphone, Mail, AlertTriangle, ShieldCheck, CheckCheck, Send, Zap, Clock } from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onSendTestNotification
}) {
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filtered = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#090f1e]/95 backdrop-blur-2xl border-l border-white/10 text-[#f4f2ec] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0c1428]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
                <Bell className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-white">Notification Dispatch Log</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {notifications.length}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400">NIC SMS GATEWAY & GOV.IN SMTP</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Bar */}
          <div className="px-5 py-3 border-b border-white/10 bg-[#070b16] flex items-center justify-between gap-2 text-xs">
            {/* Filter Chips */}
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'sms', label: 'SMS' },
                { id: 'email', label: 'Email' },
                { id: 'system', label: 'Alerts' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                    filterType === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSendTestNotification}
                className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#ff5a2c]/20 hover:bg-[#ff5a2c]/30 text-[#ff5a2c] border border-[#ff5a2c]/30 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                title="Fire a live simulated SMS alert"
              >
                <Zap className="w-3 h-3" />
                <span>Test Alert</span>
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs font-medium">No dispatch events in this category</p>
                <p className="text-[10px] text-slate-600 mt-1">Dispatches fire automatically on status updates & SLA warnings.</p>
              </div>
            ) : (
              filtered.map((item) => {
                const isSms = item.type === 'sms';
                const isEmail = item.type === 'email';
                const isConflict = item.type === 'conflict';
                const isSla = item.type === 'sla' || item.type === 'critical';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-[#0d1628]/70 hover:bg-[#121f3a]/80 transition-all space-y-2 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isSms && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Smartphone className="w-2.5 h-2.5" /> NIC SMS
                          </span>
                        )}
                        {isEmail && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            <Mail className="w-2.5 h-2.5" /> GOV SMTP
                          </span>
                        )}
                        {isConflict && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Zap className="w-2.5 h-2.5" /> OVERLAP SYNC
                          </span>
                        )}
                        {isSla && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30">
                            <AlertTriangle className="w-2.5 h-2.5" /> SLA ESCALATION
                          </span>
                        )}
                        {item.caseRef && (
                          <span className="font-mono text-[10px] text-slate-300 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                            {item.caseRef}
                          </span>
                        )}
                      </div>

                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.timestamp}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-tight">{item.title}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed font-light">{item.message}</p>
                    </div>

                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>TO: <strong className="text-slate-300 font-normal">{item.recipient}</strong></span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> DELIVERED
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-white/10 bg-[#070b16] text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> CPGRAMS & NIC Integrations Live
            </span>
            <span>TLS 1.3 / AES-256</span>
          </div>

        </div>
      </div>
    </div>
  );
}

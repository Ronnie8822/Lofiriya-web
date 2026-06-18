import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle, Activity, RefreshCw,
  Server, Database, Globe, Cpu, Wifi, Clock, Wrench,
} from 'lucide-react';

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = 'operational' | 'degraded' | 'maintenance' | 'outage';
type OverallStatus = 'operational' | 'degraded' | 'outage';

interface Service {
  name: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  icon: React.ElementType;
  description: string;
}

interface Incident {
  id: number;
  title: string;
  status: 'resolved' | 'investigating' | 'monitoring';
  date: string;
  description: string;
}

interface StatusData {
  overall: OverallStatus;
  services: Omit<Service, 'icon' | 'description'>[];
  incidents: Incident[];
}

// ─── Service icon + description map ──────────────────────────────────────────

const SERVICE_META: Record<string, { icon: React.ElementType; description: string }> = {
  Bot:             { icon: Activity,  description: 'Core Discord bot service' },
  'Lavalink Nodes':{ icon: Cpu,       description: 'Audio streaming nodes' },
  Database:        { icon: Database,  description: 'Data storage and queries' },
  Website:         { icon: Globe,     description: 'Web frontend & CDN' },
  API:             { icon: Server,    description: 'REST API endpoints' },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  operational: {
    label: 'Operational',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/12 border-emerald-500/25',
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    ring: 'ring-emerald-500/30',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-amber-400',
    bg: 'bg-amber-500/12 border-amber-500/25',
    dot: 'bg-amber-400',
    glow: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    ring: 'ring-amber-500/30',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-blue-400',
    bg: 'bg-blue-500/12 border-blue-500/25',
    dot: 'bg-blue-400',
    glow: 'shadow-[0_0_8px_rgba(96,165,250,0.5)]',
    ring: 'ring-blue-500/30',
  },
  outage: {
    label: 'Outage',
    color: 'text-red-400',
    bg: 'bg-red-500/12 border-red-500/25',
    dot: 'bg-red-400',
    glow: 'shadow-[0_0_8px_rgba(248,113,113,0.5)]',
    ring: 'ring-red-500/30',
  },
};

const OVERALL_CFG = {
  operational: {
    label: 'All Systems Operational',
    emoji: '🟢',
    bg: 'bg-emerald-500/8 border-emerald-500/25',
    glow: '0 0 40px rgba(52,211,153,0.12)',
    pulse: 'bg-emerald-400',
  },
  degraded: {
    label: 'Partial Service Disruption',
    emoji: '🟡',
    bg: 'bg-amber-500/8 border-amber-500/25',
    glow: '0 0 40px rgba(251,191,36,0.12)',
    pulse: 'bg-amber-400',
  },
  outage: {
    label: 'Major Outage',
    emoji: '🔴',
    bg: 'bg-red-500/8 border-red-500/25',
    glow: '0 0 40px rgba(248,113,113,0.12)',
    pulse: 'bg-red-400',
  },
};

const INCIDENT_STATUS_CFG = {
  resolved:      { label: 'Resolved',      color: 'text-emerald-400', bg: 'bg-emerald-500/12 border-emerald-500/25' },
  investigating: { label: 'Investigating', color: 'text-amber-400',   bg: 'bg-amber-500/12 border-amber-500/25' },
  monitoring:    { label: 'Monitoring',    color: 'text-blue-400',    bg: 'bg-blue-500/12 border-blue-500/25' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.04] animate-pulse ${className}`} />;
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ServiceStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className="relative flex items-center justify-center w-2.5 h-2.5">
      {status === 'operational' && (
        <span className={`absolute inline-flex w-full h-full rounded-full ${cfg.dot} opacity-60 animate-ping`} />
      )}
      <span className={`relative w-2 h-2 rounded-full ${cfg.dot} ${status === 'operational' ? cfg.glow : ''}`} />
    </span>
  );
}

// ─── Uptime Bar ───────────────────────────────────────────────────────────────

function UptimeBar({ uptime }: { uptime: number }) {
  const segments = 30;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: segments }).map((_, i) => {
        const threshold = segments - Math.floor((uptime / 100) * segments);
        const ok = i >= threshold;
        return (
          <div
            key={i}
            className={`h-5 w-1.5 rounded-sm ${ok ? 'bg-emerald-500/70' : 'bg-red-500/50'}`}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Status() {
  const [data, setData]           = useState<StatusData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${BASE_PATH}/data/status.json?t=${Date.now()}`);
      const json: StatusData = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      // keep existing data on refresh failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="relative min-h-screen bg-background pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const overallCfg = OVERALL_CFG[data.overall];
  const services: Service[] = data.services.map(s => ({
    ...s,
    ...(SERVICE_META[s.name] ?? { icon: Server, description: 'System service' }),
  }));

  // Uptime summary cards
  const summaryServices = services.filter(s => ['Bot', 'Website', 'API', 'Database'].includes(s.name));

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="aurora-blob w-[500px] h-[500px] bg-primary/8 -top-[10%] -left-[8%] rounded-full" />
        <div className="aurora-blob w-[350px] h-[350px] bg-emerald-500/5 bottom-[15%] right-[5%] rounded-full" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="relative z-10 pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">

          {/* ══ HEADER ════════════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/22 mb-5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Live Status</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white mb-3">
              System Status
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Monitor the health and performance of LOFIRIYA services in real time.
            </p>

            {/* Demo data disclaimer */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/25">
                <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-400">Demo Status Data — Monitoring System Not Connected</span>
              </div>
            </div>
            <p className="text-center text-xs text-white/30 mt-2">
              Real-time monitoring will be available once monitoring services are connected.
            </p>

            {/* Last updated + refresh */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-white/25">
                <Clock className="w-3 h-3" />
                <span>Last checked: {lastUpdated ? formatTime(lastUpdated) : '—'}</span>
              </div>
              <button
                onClick={() => fetchAll(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>

          {/* ══ GLOBAL STATUS BANNER ══════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={data.overall}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border p-5 mb-6 flex items-center gap-4 ${overallCfg.bg}`}
              style={{ boxShadow: overallCfg.glow }}
            >
              {/* Animated pulse indicator */}
              <div className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `${data.overall === 'operational' ? 'rgba(52,211,153,0.15)' : data.overall === 'degraded' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)'}` }}>
                <span className={`absolute w-full h-full rounded-full ${overallCfg.pulse} opacity-20 animate-ping`} />
                <span className={`w-4 h-4 rounded-full ${overallCfg.pulse}`} style={{ boxShadow: `0 0 12px currentColor` }} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-display font-bold text-white">
                  {overallCfg.emoji} {overallCfg.label}
                </h2>
                <p className="text-xs text-white/45 mt-0.5">
                  {data.services.length} services monitored · Updated {lastUpdated ? formatTime(lastUpdated) : '—'}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-xs font-semibold text-white/50">
                  {data.services.filter(s => s.status === 'operational').length}/{data.services.length} operational
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ══ UPTIME SUMMARY CARDS ══════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {summaryServices.map((svc, i) => {
              const cfg = STATUS_CFG[svc.status];
              return (
                <motion.div
                  key={svc.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/7 bg-white/[0.025] p-4 text-center"
                >
                  <svc.icon className={`w-4 h-4 mx-auto mb-2 ${cfg.color}`} />
                  <p className="text-xs text-white/45 mb-1">{svc.name} Uptime</p>
                  <p className="text-xl font-display font-bold text-white">{svc.uptime}%</p>
                  <p className={`text-[10px] font-semibold mt-1 ${cfg.color}`}>{cfg.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* ══ SERVICE LIST ══════════════════════════════════════════════ */}
          <div className="mb-10">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Services</h3>
            <div className="rounded-2xl border border-white/7 bg-white/[0.015] overflow-hidden divide-y divide-white/[0.05]">
              {services.map((svc, i) => {
                const cfg = STATUS_CFG[svc.status];
                return (
                  <motion.div
                    key={svc.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                      <svc.icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{svc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-semibold bg-amber-500/10 border-amber-500/20 text-amber-400/80">
                            Demo
                          </span>
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">{svc.description}</p>
                    </div>

                    {/* Uptime */}
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-white/35">Uptime</p>
                      <p className="text-sm font-semibold text-white">{svc.uptime}%</p>
                    </div>

                    {/* Latency */}
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-white/35">Latency</p>
                      <p className="text-sm font-semibold text-white/50">—</p>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusDot status={svc.status} />
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ══ 30-DAY UPTIME BARS ════════════════════════════════════════ */}
          <div className="mb-10">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 px-1">30-Day Uptime</h3>
            <div className="rounded-2xl border border-white/7 bg-white/[0.015] divide-y divide-white/[0.05] overflow-hidden">
              {services.map((svc, i) => (
                <motion.div
                  key={svc.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 + 0.3 }}
                  className="px-5 py-3.5 flex items-center gap-4"
                >
                  <span className="text-sm text-white/60 w-32 flex-shrink-0">{svc.name}</span>
                  <div className="flex-1">
                    <UptimeBar uptime={svc.uptime} />
                  </div>
                  <span className="text-sm font-semibold text-white w-14 text-right flex-shrink-0">{svc.uptime}%</span>
                </motion.div>
              ))}
              <div className="px-5 py-2.5 flex items-center justify-between text-[10px] text-white/25">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* ══ INCIDENT HISTORY ══════════════════════════════════════════ */}
          {data.incidents.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Incident History</h3>
              <div className="space-y-3">
                {data.incidents.map((incident, i) => {
                  const iCfg = INCIDENT_STATUS_CFG[incident.status];
                  return (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 + 0.4 }}
                      className="rounded-2xl border border-white/7 bg-white/[0.015] p-5 hover:border-white/12 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className="font-semibold text-white text-sm">{incident.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${iCfg.bg} ${iCfg.color}`}>
                              {iCfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed">{incident.description}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/30 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeDate(incident.date)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty incident state */}
          {data.incidents.length === 0 && (
            <div className="rounded-2xl border border-white/7 bg-white/[0.015] p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3 opacity-60" />
              <p className="text-sm text-white/40">No incidents in the past 90 days.</p>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-8 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 text-center">
            <p className="text-xs text-amber-400/70 font-medium">
              ⚠️ The values shown above are demo placeholders. Real-time monitoring will be available once monitoring services are connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

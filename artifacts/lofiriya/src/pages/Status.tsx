import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle, Activity, RefreshCw,
  Server, Database, Globe, Cpu, Wifi, Clock,
} from 'lucide-react';

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'unknown';
type OverallStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

interface ServiceData {
  name:      string;
  status:    ServiceStatus;
  latency:   number | null;
  detail:    string;
  connected: boolean;
}

interface StatusApiResponse {
  overall:  OverallStatus;
  services: ServiceData[];
  meta: {
    uptime:    number;
    timestamp: string;
    checkedAt: string;
  };
}

// ─── Service metadata (icons + descriptions) ──────────────────────────────────

const SERVICE_META: Record<string, { icon: React.ElementType; description: string }> = {
  Bot:              { icon: Activity,  description: 'Core Discord bot service'      },
  'Lavalink Nodes': { icon: Cpu,       description: 'Audio streaming nodes'          },
  Database:         { icon: Database,  description: 'Data storage and queries'       },
  Website:          { icon: Globe,     description: 'Web frontend & CDN'             },
  API:              { icon: Server,    description: 'REST API endpoints'             },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ServiceStatus, {
  label: string; color: string; bg: string; dot: string; glow: string; ring: string;
}> = {
  operational: {
    label: 'Operational',
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/12 border-emerald-500/25',
    dot:   'bg-emerald-400',
    glow:  'shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    ring:  'ring-emerald-500/30',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-amber-400',
    bg:    'bg-amber-500/12 border-amber-500/25',
    dot:   'bg-amber-400',
    glow:  'shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    ring:  'ring-amber-500/30',
  },
  outage: {
    label: 'Not Connected',
    color: 'text-red-400',
    bg:    'bg-red-500/12 border-red-500/25',
    dot:   'bg-red-400',
    glow:  'shadow-[0_0_8px_rgba(248,113,113,0.5)]',
    ring:  'ring-red-500/30',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-white/40',
    bg:    'bg-white/5 border-white/10',
    dot:   'bg-white/40',
    glow:  '',
    ring:  'ring-white/10',
  },
};

const OVERALL_CFG: Record<OverallStatus, {
  label: string; emoji: string; bg: string; glow: string; pulse: string; Icon: React.ElementType;
}> = {
  operational: {
    label: 'All Systems Operational',
    emoji: '🟢',
    bg:    'bg-emerald-500/8 border-emerald-500/25',
    glow:  '0 0 40px rgba(52,211,153,0.12)',
    pulse: 'bg-emerald-400',
    Icon:  CheckCircle2,
  },
  degraded: {
    label: 'Partial Service Disruption',
    emoji: '🟡',
    bg:    'bg-amber-500/8 border-amber-500/25',
    glow:  '0 0 40px rgba(251,191,36,0.12)',
    pulse: 'bg-amber-400',
    Icon:  AlertTriangle,
  },
  outage: {
    label: 'Service Unavailable',
    emoji: '🔴',
    bg:    'bg-red-500/8 border-red-500/25',
    glow:  '0 0 40px rgba(248,113,113,0.12)',
    pulse: 'bg-red-400',
    Icon:  XCircle,
  },
  unknown: {
    label: 'Status Unknown',
    emoji: '⚪',
    bg:    'bg-white/5 border-white/10',
    glow:  '0 0 40px rgba(255,255,255,0.04)',
    pulse: 'bg-white/40',
    Icon:  Wifi,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatUptime(seconds: number): string {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  svc, index,
}: {
  svc: ServiceData & { icon: React.ElementType };
  index: number;
}) {
  const cfg = STATUS_CFG[svc.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-white/7 bg-white/[0.025] p-4 text-center"
    >
      <svc.icon className={`w-4 h-4 mx-auto mb-2 ${cfg.color}`} />
      <p className="text-xs text-white/45 mb-1">{svc.name}</p>
      {svc.connected ? (
        <>
          <p className={`text-xs font-semibold mt-1 ${cfg.color}`}>{cfg.label}</p>
          {svc.latency !== null && (
            <p className="text-[10px] text-white/30 mt-0.5">{svc.latency}ms</p>
          )}
        </>
      ) : (
        <p className="text-xs font-semibold mt-1 text-red-400/80">Not Connected</p>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Status() {
  const [data, setData]               = useState<StatusApiResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError]   = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(`${BASE_PATH}/api/status?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StatusApiResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch status');
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

  const overallStatus: OverallStatus = data?.overall ?? 'unknown';
  const overallCfg = OVERALL_CFG[overallStatus];
  const services: (ServiceData & { icon: React.ElementType; description: string })[] =
    (data?.services ?? []).map(s => ({
      ...s,
      ...(SERVICE_META[s.name] ?? { icon: Server, description: 'System service' }),
    }));

  const summaryServices = services.filter(s =>
    ['Bot', 'Website', 'API', 'Database'].includes(s.name)
  );

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
              Real-time health and performance of LOFIRIYA services.
            </p>

            {/* Fetch error */}
            {fetchError && (
              <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/25">
                <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-red-400">Could not reach status API — {fetchError}</span>
              </div>
            )}

            {/* Last updated + refresh */}
            <div className="flex items-center justify-center gap-3 mt-4">
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
              key={overallStatus}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border p-5 mb-6 flex items-center gap-4 ${overallCfg.bg}`}
              style={{ boxShadow: overallCfg.glow }}
            >
              <div
                className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: overallStatus === 'operational' ? 'rgba(52,211,153,0.15)'
                  : overallStatus === 'degraded'    ? 'rgba(251,191,36,0.15)'
                  : overallStatus === 'outage'      ? 'rgba(248,113,113,0.15)'
                  : 'rgba(255,255,255,0.07)' }}
              >
                <span className={`absolute w-full h-full rounded-full ${overallCfg.pulse} opacity-20 animate-ping`} />
                <span className={`w-4 h-4 rounded-full ${overallCfg.pulse}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-display font-bold text-white">
                  {overallCfg.emoji} {overallCfg.label}
                </h2>
                <p className="text-xs text-white/45 mt-0.5">
                  {services.length} services monitored · Updated {lastUpdated ? formatTime(lastUpdated) : '—'}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-xs font-semibold text-white/50">
                  {services.filter(s => s.connected).length}/{services.length} connected
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* No data state */}
          {!data && !fetchError && (
            <div className="rounded-2xl border border-white/7 bg-white/[0.015] p-8 text-center mb-6">
              <Wifi className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">No monitoring data available.</p>
            </div>
          )}

          {/* ══ SUMMARY CARDS ═════════════════════════════════════════════ */}
          {summaryServices.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {summaryServices.map((svc, i) => (
                <StatCard key={svc.name} svc={svc} index={i} />
              ))}
            </div>
          )}

          {/* ══ SERVICE LIST ══════════════════════════════════════════════ */}
          {services.length > 0 && (
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
                        <span className="font-semibold text-white text-sm">{svc.name}</span>
                        <p className="text-xs text-white/35 mt-0.5">{svc.description}</p>
                      </div>

                      {/* Detail / uptime info */}
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-white/30">{svc.detail}</p>
                      </div>

                      {/* Latency */}
                      <div className="hidden md:block text-right w-20">
                        {svc.latency !== null ? (
                          <>
                            <p className="text-xs text-white/35">Latency</p>
                            <p className="text-sm font-semibold text-white">{svc.latency}ms</p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-white/25">—</p>
                        )}
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
          )}

          {/* ══ API UPTIME ════════════════════════════════════════════════ */}
          {data?.meta && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 px-1">API Uptime</h3>
              <div className="rounded-2xl border border-white/7 bg-white/[0.015] p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                      <Server className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">API Server</p>
                      <p className="text-xs text-white/35">Current session uptime</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-white">
                      {formatUptime(data.meta.uptime)}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      Since {new Date(Date.now() - data.meta.uptime * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ NO INCIDENTS ══════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-white/7 bg-white/[0.015] p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold text-white/60 mb-1">No Incidents</p>
            <p className="text-xs text-white/30">No incidents have been reported.</p>
          </div>

        </div>
      </div>
    </div>
  );
        }

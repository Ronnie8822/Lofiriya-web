import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Music2, List, Settings, LogOut, Server,
  Crown, Clock, Heart, Sliders, Volume2, ChevronRight,
  Shield, Plus, Trash2, Copy, Edit3, Check, X as XIcon,
  Loader2, RefreshCw, ExternalLink, User, Hash, Zap,
  Play, Pause, SkipForward, Shuffle, Repeat, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { SiDiscord } from 'react-icons/si';

/* ─── Types ────────────────────────────────────────────── */
interface DiscordUser {
  id: string; username: string; discriminator: string;
  avatar: string | null; global_name: string | null; email?: string;
}
interface DiscordGuild {
  id: string; name: string; icon: string | null;
  permissions: string; owner: boolean; hasBot: boolean;
}
interface UserData {
  discordId: string; username: string; globalName: string;
  avatar: string | null; premium: { active: boolean; plan: string; since: string | null; expiresAt: string | null };
  savedPlaylists: number; favoriteSongs: number;
  totalSongsPlayed: number; totalListenTime: number; premiumServers: number;
}
interface GuildSettings {
  guildId: string; prefix: string; volume: number;
  mode247: boolean; autoplay: boolean; djRoleId: string | null;
}
interface DiscordRole { id: string; name: string; color: number; position: number; }
interface Song {
  _id: string; title: string; artist: string; duration: number;
  source: string; thumbnail: string | null; url: string; addedAt: string; addedBy: string;
}
interface Playlist {
  _id: string; ownerId: string; name: string; description: string;
  songs: Song[]; color: string; isPublic: boolean; createdAt: string; updatedAt: string;
}
interface PlayerState { active: boolean; reason: string; }
interface ActivityEntry {
  _id: string; userId: string; action: string; detail: string;
  meta: Record<string, unknown>; createdAt: string;
}

type DashTab = 'overview' | 'servers' | 'music' | 'settings';

/* ─── Helpers ───────────────────────────────────────────── */
function avatarUrl(user: DiscordUser) {
  if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`;
  const n = user.discriminator === '0' ? Number(BigInt(user.id) >> BigInt(22)) % 6
                                       : parseInt(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${n}.png`;
}
function guildIconUrl(g: DiscordGuild) {
  if (!g.icon) return null;
  return `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.webp?size=64`;
}
function initials(name: string) { return name.slice(0, 2).toUpperCase(); }
function fmtDuration(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function fmtListenTime(s: number) {
  const h = Math.floor(s / 3600);
  if (h > 0) return `${h}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 60)}m`;
}
function timeSince(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(d / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function roleColor(c: number) {
  if (!c) return '#99aab5';
  return `#${c.toString(16).padStart(6, '0')}`;
}

const GUILD_PALETTE = [
  'from-violet-500 to-indigo-600', 'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-600',     'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',  'from-fuchsia-500 to-purple-600',
];
const PLAYLIST_COLORS = [
  { label: 'Purple', value: 'from-violet-500 to-indigo-600' },
  { label: 'Cyan',   value: 'from-cyan-500 to-blue-600'     },
  { label: 'Rose',   value: 'from-rose-500 to-pink-600'     },
  { label: 'Green',  value: 'from-emerald-500 to-teal-600'  },
  { label: 'Amber',  value: 'from-amber-500 to-orange-600'  },
  { label: 'Fuchsia',value: 'from-fuchsia-500 to-purple-600'},
];
const ACTION_LABELS: Record<string, string> = {
  login: 'Logged in', logout: 'Logged out',
  playlist_created: 'Created playlist', playlist_deleted: 'Deleted playlist',
  playlist_updated: 'Updated playlist', settings_updated: 'Updated settings',
};

/* ─── API helpers ───────────────────────────────────────── */
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ─── Sub-components ─────────────────────────────────────── */

function NoData({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      <AlertCircle className="w-8 h-8 opacity-40" />
      <p className="text-sm opacity-60">{message}</p>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
        {icon}<span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

/* ─── Login Screen ──────────────────────────────────────── */
const MUSIC_PARTICLES = [
  { icon: '♪', left: '8%',  delay: 0,    dur: 14, size: 22, op: 0.12 },
  { icon: '♫', left: '22%', delay: 2.5,  dur: 18, size: 16, op: 0.08 },
  { icon: '♩', left: '38%', delay: 1.2,  dur: 12, size: 28, op: 0.07 },
  { icon: '♬', left: '55%', delay: 3.8,  dur: 16, size: 18, op: 0.10 },
  { icon: '♪', left: '68%', delay: 0.7,  dur: 20, size: 14, op: 0.09 },
  { icon: '♫', left: '80%', delay: 2.1,  dur: 15, size: 24, op: 0.06 },
  { icon: '♩', left: '91%', delay: 4.5,  dur: 17, size: 20, op: 0.08 },
];

function LoginScreen() {
  return (
    <div className="pt-20 min-h-screen relative overflow-hidden flex items-center justify-center">

      {/* ── Banner background with glassmorphism dark layer ── */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src="/banner.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: 'blur(4px) brightness(0.25) saturate(1.3)' }}
        />
        {/* Deep dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050010]/90 via-[#0a0018]/80 to-[#060014]/92" />
        {/* Purple ambient glow — centre */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_55%,_rgba(124,58,237,0.18)_0%,_transparent_70%)]" />
        {/* Subtle top-left accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_15%_20%,_rgba(139,92,246,0.10)_0%,_transparent_60%)]" />
      </div>

      {/* ── Aurora blobs ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="aurora-blob w-[500px] h-[500px] bg-primary/14 top-[-10%] left-[-10%] rounded-full" />
        <div className="aurora-blob w-[400px] h-[400px] bg-accent/10 bottom-[-10%] right-[-10%] rounded-full"
          style={{ animationDelay: '-6s' }} />
      </div>

      {/* ── Floating music particles ── */}
      {MUSIC_PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none text-primary/80 font-bold"
          style={{ left: p.left, bottom: '-8%', fontSize: p.size, opacity: p.op }}
          animate={{ y: [0, -1400], opacity: [p.op, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          aria-hidden
        >
          {p.icon}
        </motion.span>
      ))}

      {/* ── Login card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md w-full mx-4 text-center"
        style={{ filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.9))' }}
      >
        {/* Glow halo behind the card */}
        <div className="absolute -inset-4 rounded-[2.5rem] blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />

        <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.07)]">
          {/* Discord icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/25 flex items-center justify-center mx-auto mb-6 shadow-[0_0_24px_rgba(88,101,242,0.25)]">
            <SiDiscord className="w-8 h-8 text-[#5865F2]" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-white">Welcome to Dashboard</h1>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Sign in with Discord to manage your servers, playlists, and music settings.
          </p>

          <Button
            asChild size="lg"
            className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold rounded-xl gap-3 h-12 shadow-[0_0_20px_rgba(88,101,242,0.35)] hover:shadow-[0_0_32px_rgba(88,101,242,0.55)] transition-all"
          >
            <a href="/api/auth/login">
              <SiDiscord className="w-5 h-5" />
              Sign in with Discord
            </a>
          </Button>

          <p className="text-xs text-white/25 mt-6">
            We only request <code className="text-white/40">identify</code>, <code className="text-white/40">guilds</code> and <code className="text-white/40">email</code> scopes.
            We never post on your behalf.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Overview Tab ──────────────────────────────────────── */
function OverviewTab({
  user, userData, guilds, playlists, activity, loadingActivity,
}: {
  user: DiscordUser; userData: UserData | null;
  guilds: DiscordGuild[]; playlists: Playlist[];
  activity: ActivityEntry[]; loadingActivity: boolean;
}) {
  const botGuilds = guilds.filter(g => g.hasBot);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 via-accent/10 to-transparent border border-white/5 rounded-2xl p-6 flex items-center gap-5">
        <img src={avatarUrl(user)} alt="avatar"
          className="w-16 h-16 rounded-2xl ring-2 ring-primary/40 object-cover" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">
            Hello, {userData?.globalName || user.global_name || user.username}
          </h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {userData?.premium?.active && (
            <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
              <Crown className="w-3 h-3" />{userData.premium.plan} Premium
            </Badge>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <span className="text-xs text-muted-foreground">Bot active in</span>
          <span className="text-2xl font-bold text-primary">{botGuilds.length}</span>
          <span className="text-xs text-muted-foreground">server{botGuilds.length !== 1 ? 's' : ''}</span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Server className="w-4 h-4" />} label="Servers"
          value={botGuilds.length === 0 ? '—' : String(botGuilds.length)}
          sub="Bot active" />
        <StatCard icon={<List className="w-4 h-4" />} label="Playlists"
          value={playlists.length === 0 ? '—' : String(playlists.length)}
          sub={`${userData?.savedPlaylists ?? 0} total saved`} />
        <StatCard icon={<Heart className="w-4 h-4" />} label="Favourites"
          value={userData?.favoriteSongs ? String(userData.favoriteSongs) : '—'}
          sub="Saved songs" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Listen Time"
          value={userData?.totalListenTime ? fmtListenTime(userData.totalListenTime) : '—'}
          sub="All time" />
      </div>

      {/* Servers + Activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active servers */}
        <div className="bg-surface border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Active Servers
          </h3>
          {botGuilds.length === 0 ? (
            <NoData message="Bot not in any of your servers yet" />
          ) : (
            <div className="space-y-3">
              {botGuilds.slice(0, 5).map((g, i) => {
                const icon = guildIconUrl(g);
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    {icon ? (
                      <img src={icon} alt={g.name} className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GUILD_PALETTE[i % GUILD_PALETTE.length]} flex items-center justify-center text-white text-xs font-bold`}>
                        {initials(g.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{g.name}</div>
                      {g.owner && <div className="text-xs text-amber-400">Owner</div>}
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">Active</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-surface border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Recent Activity
          </h3>
          {loadingActivity ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : activity.length === 0 ? (
            <NoData message="No activity recorded yet" />
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 6).map(a => (
                <div key={a._id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{ACTION_LABELS[a.action] ?? a.action}</div>
                    {a.detail && <div className="text-xs text-muted-foreground truncate">{a.detail}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">{timeSince(a.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Servers Tab ───────────────────────────────────────── */
function ServersTab({
  guilds, loading, onManage,
}: {
  guilds: DiscordGuild[]; loading: boolean;
  onManage: (g: DiscordGuild) => void;
}) {
  const botGuilds = guilds.filter(g => g.hasBot);
  const noBot     = guilds.filter(g => !g.hasBot);

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-6">
      {/* Bot-active */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Bot Active ({botGuilds.length})
        </h3>
        {botGuilds.length === 0 ? (
          <NoData message="Bot isn't in any of your manageable servers yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {botGuilds.map((g, i) => <GuildCard key={g.id} guild={g} index={i} onManage={onManage} />)}
          </div>
        )}
      </div>

      {/* No bot */}
      {noBot.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Add Bot ({noBot.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {noBot.map((g, i) => <GuildCard key={g.id} guild={g} index={i} onManage={onManage} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function GuildCard({ guild, index, onManage }: { guild: DiscordGuild; index: number; onManage: (g: DiscordGuild) => void; }) {
  const icon = guildIconUrl(guild);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
      className="bg-surface border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {icon ? (
          <img src={icon} alt={guild.name} className="w-11 h-11 rounded-xl object-cover" />
        ) : (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${GUILD_PALETTE[index % GUILD_PALETTE.length]} flex items-center justify-center text-white font-bold`}>
            {initials(guild.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{guild.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            {guild.owner && <><Crown className="w-3 h-3 text-amber-400" /><span className="text-amber-400">Owner</span></>}
            {!guild.owner && <><Shield className="w-3 h-3" /><span>Admin</span></>}
          </div>
        </div>
        {guild.hasBot
          ? <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">Active</Badge>
          : <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[10px]">No Bot</Badge>}
      </div>
      {guild.hasBot ? (
        <Button size="sm" variant="outline"
          className="w-full border-white/10 hover:border-primary/50 hover:text-primary rounded-xl text-xs gap-2"
          onClick={() => onManage(guild)}>
          <Settings className="w-3.5 h-3.5" /> Manage Server
        </Button>
      ) : (
        <Button size="sm" asChild
          className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl text-xs gap-2">
          <a href={`https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot&guild_id=${guild.id}`}
            target="_blank" rel="noopener noreferrer">
            <Plus className="w-3.5 h-3.5" /> Add Bot
          </a>
        </Button>
      )}
    </motion.div>
  );
}

/* ─── Server Settings Modal ─────────────────────────────── */
function ServerSettingsModal({
  guild, onClose,
}: {
  guild: DiscordGuild; onClose: () => void;
}) {
  const [settings, setSettings]       = useState<GuildSettings | null>(null);
  const [roles, setRoles]             = useState<DiscordRole[]>([]);
  const [player, setPlayer]           = useState<PlayerState | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [localSettings, setLocal]     = useState<Partial<GuildSettings>>({});
  const [rolesOpen, setRolesOpen]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, p] = await Promise.all([
          api<GuildSettings>(`/guild/${guild.id}/settings`),
          api<DiscordRole[]>(`/guild/${guild.id}/roles`),
          api<PlayerState>(`/guild/${guild.id}/player`),
        ]);
        if (cancelled) return;
        setSettings(s);
        setRoles(r);
        setPlayer(p);
        setLocal(s);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [guild.id]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api<GuildSettings>(`/guild/${guild.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(localSettings),
      });
      setSettings(updated);
      setLocal(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const icon = guildIconUrl(guild);
  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-surface border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {icon ? (
            <img src={icon} alt={guild.name} className="w-10 h-10 rounded-xl" />
          ) : (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GUILD_PALETTE[0]} flex items-center justify-center text-white font-bold text-sm`}>
              {initials(guild.name)}
            </div>
          )}
          <div>
            <h2 className="font-bold text-lg">{guild.name}</h2>
            <p className="text-xs text-muted-foreground">Server Settings</p>
          </div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5">
            {/* Player status */}
            {player && (
              <div className={`rounded-xl p-3 border text-sm flex items-center gap-3 ${player.active
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                {player.active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {player.active ? 'Player is active' : player.reason}
              </div>
            )}

            {/* Volume */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 block">
                Default Volume — {localSettings.volume ?? 100}%
              </label>
              <input type="range" min={0} max={200} step={5}
                value={localSettings.volume ?? 100}
                onChange={e => setLocal(p => ({ ...p, volume: parseInt(e.target.value) }))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span><span>100%</span><span>200%</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {[
                { key: 'mode247' as const, label: '24/7 Mode', desc: 'Bot stays in voice channel even when empty', icon: <Clock className="w-4 h-4 text-primary" /> },
                { key: 'autoplay' as const, label: 'Autoplay', desc: 'Auto-queue related tracks when queue ends', icon: <Shuffle className="w-4 h-4 text-accent" /> },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  <button
                    onClick={() => setLocal(p => ({ ...p, [key]: !p[key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${localSettings[key] ? 'bg-primary' : 'bg-white/15'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localSettings[key] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* DJ Role */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 block">DJ Role</label>
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground bg-white/5 rounded-xl p-3">
                  No roles available — bot may not be in this server
                </div>
              ) : (
                <div className="relative">
                  <button onClick={() => setRolesOpen(o => !o)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between hover:border-white/20 transition-colors">
                    {localSettings.djRoleId
                      ? <span style={{ color: roleColor(roles.find(r => r.id === localSettings.djRoleId)?.color ?? 0) }}>
                          @{roles.find(r => r.id === localSettings.djRoleId)?.name ?? 'Unknown'}
                        </span>
                      : <span className="text-muted-foreground">None — everyone can use bot</span>}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <AnimatePresence>
                    {rolesOpen && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="absolute z-10 w-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <button onClick={() => { setLocal(p => ({ ...p, djRoleId: null })); setRolesOpen(false); }}
                          className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors text-muted-foreground">
                          None
                        </button>
                        {roles.map(r => (
                          <button key={r.id} onClick={() => { setLocal(p => ({ ...p, djRoleId: r.id })); setRolesOpen(false); }}
                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: roleColor(r.color) }} />
                            <span style={{ color: roleColor(r.color) }}>@{r.name}</span>
                            {localSettings.djRoleId === r.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose}
                className="flex-1 border-white/10 hover:border-white/20 rounded-xl">
                Cancel
              </Button>
              <Button onClick={save} disabled={!isDirty || saving}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Music Tab ──────────────────────────────────────────── */
function MusicTab({
  playlists, loading, onRefresh,
}: {
  playlists: Playlist[]; loading: boolean; onRefresh: () => void;
}) {
  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [newColor, setNewColor]   = useState(PLAYLIST_COLORS[0].value);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [selected, setSelected]   = useState<Playlist | null>(null);

  const createPlaylist = async () => {
    if (!newName.trim()) return;
    setSaving(true); setError('');
    try {
      await api('/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      setCreating(false); setNewName(''); setNewColor(PLAYLIST_COLORS[0].value);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const deletePlaylist = async (id: string) => {
    setDeleting(id);
    try {
      await api(`/playlists/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const duplicatePlaylist = async (id: string) => {
    try {
      await api(`/playlists/${id}/duplicate`, { method: 'POST' });
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to duplicate');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">My Playlists</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{playlists.length} / 10 playlists</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRefresh}
            className="border-white/10 hover:border-white/20 rounded-xl gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}
            className="bg-primary hover:bg-primary/90 rounded-xl gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Playlist
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{error}</div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-surface border border-primary/20 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-sm">New Playlist</h4>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createPlaylist(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Playlist name…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {PLAYLIST_COLORS.map(c => (
                  <button key={c.value} onClick={() => setNewColor(c.value)}
                    title={c.label}
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.value} ring-2 transition-all ${newColor === c.value ? 'ring-white scale-110' : 'ring-transparent'}`} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={() => setCreating(false)}
                className="flex-1 border-white/10 rounded-xl text-xs">Cancel</Button>
              <Button size="sm" onClick={createPlaylist} disabled={!newName.trim() || saving}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl gap-2 text-xs">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist grid */}
      {playlists.length === 0 ? (
        <NoData message="No playlists yet — create your first one!" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {playlists.map((pl, i) => (
            <motion.div key={pl._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-surface border border-white/5 rounded-2xl overflow-hidden group">
              {/* Color banner */}
              <div className={`bg-gradient-to-r ${pl.color} h-16 relative`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-3 left-4 text-white font-bold text-sm truncate pr-4">{pl.name}</div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Music2 className="w-3.5 h-3.5" />{pl.songs.length} songs</span>
                  <span>{timeSince(pl.updatedAt)}</span>
                </div>
                {pl.description && <p className="text-xs text-muted-foreground line-clamp-2">{pl.description}</p>}
                {/* Songs preview */}
                {pl.songs.length > 0 ? (
                  <div className="space-y-1">
                    {pl.songs.slice(0, 3).map(s => (
                      <div key={s._id} className="flex items-center gap-2 text-xs">
                        <Play className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-foreground/80">{s.title}</span>
                        {s.duration > 0 && <span className="text-muted-foreground flex-shrink-0">{fmtDuration(s.duration)}</span>}
                      </div>
                    ))}
                    {pl.songs.length > 3 && (
                      <button onClick={() => setSelected(pl)}
                        className="text-xs text-primary hover:underline">
                        +{pl.songs.length - 3} more songs
                      </button>
                    )}
                  </div>
                ) : null}
                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setSelected(pl)}
                    className="flex-1 border-white/10 hover:border-primary/40 rounded-xl text-xs gap-1.5">
                    <Edit3 className="w-3 h-3" /> View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicatePlaylist(pl._id)}
                    className="border-white/10 hover:border-white/20 rounded-xl px-2.5">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deletePlaylist(pl._id)}
                    disabled={deleting === pl._id}
                    className="border-white/10 hover:border-red-500/40 hover:text-red-400 rounded-xl px-2.5">
                    {deleting === pl._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Playlist detail modal */}
      <AnimatePresence>
        {selected && (
          <PlaylistModal playlist={selected} onClose={() => setSelected(null)} onRefresh={onRefresh} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Playlist Detail Modal ─────────────────────────────── */
function PlaylistModal({
  playlist, onClose, onRefresh,
}: {
  playlist: Playlist; onClose: () => void; onRefresh: () => void;
}) {
  const [songs, setSongs]       = useState<Song[]>(playlist.songs);
  const [adding, setAdding]     = useState(false);
  const [form, setForm]         = useState({ title: '', artist: '', url: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [delSong, setDelSong]   = useState<string | null>(null);

  const addSong = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true); setError('');
    try {
      const updated = await api<Playlist>(`/playlists/${playlist._id}/songs`, {
        method: 'POST',
        body: JSON.stringify({ title: form.title.trim(), artist: form.artist.trim(), url: form.url.trim() }),
      });
      setSongs((updated as Playlist).songs);
      setForm({ title: '', artist: '', url: '' });
      setAdding(false);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add song');
    } finally {
      setSaving(false);
    }
  };

  const removeSong = async (songId: string) => {
    setDelSong(songId);
    try {
      const updated = await api<Playlist>(`/playlists/${playlist._id}/songs/${songId}`, { method: 'DELETE' });
      setSongs((updated as Playlist).songs);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setDelSong(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-surface border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${playlist.color} rounded-t-3xl p-6 relative`}>
          <div className="absolute inset-0 bg-black/30 rounded-t-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{playlist.name}</h2>
              <p className="text-white/70 text-sm mt-0.5">{songs.length} songs</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{error}</div>
          )}

          {/* Add song form */}
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="border border-primary/20 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-medium">Add Song</h4>
                {[
                  { key: 'title', placeholder: 'Song title *', required: true },
                  { key: 'artist', placeholder: 'Artist (optional)', required: false },
                  { key: 'url', placeholder: 'URL (YouTube, Spotify…) *', required: true },
                ].map(f => (
                  <input key={f.key} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors" />
                ))}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAdding(false)}
                    className="flex-1 border-white/10 rounded-xl text-xs">Cancel</Button>
                  <Button size="sm" onClick={addSong} disabled={!form.title.trim() || !form.url.trim() || saving}
                    className="flex-1 bg-primary hover:bg-primary/90 rounded-xl text-xs gap-2">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Add
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Songs list */}
          {songs.length === 0 ? (
            <NoData message="No songs yet — add some!" />
          ) : (
            <div className="space-y-2">
              {songs.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 group">
                  <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    {s.artist && <div className="text-xs text-muted-foreground truncate">{s.artist}</div>}
                  </div>
                  {s.duration > 0 && <span className="text-xs text-muted-foreground flex-shrink-0">{fmtDuration(s.duration)}</span>}
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => removeSong(s._id)} disabled={delSong === s._id}
                    className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    {delSong === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <Button onClick={() => setAdding(true)} disabled={adding}
            className="w-full bg-primary hover:bg-primary/90 rounded-xl gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Song
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Settings Tab ───────────────────────────────────────── */
function SettingsTab({ user, userData, onLogout }: { user: DiscordUser; userData: UserData | null; onLogout: () => void; }) {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <div className="bg-surface border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <img src={avatarUrl(user)} alt="avatar" className="w-16 h-16 rounded-2xl ring-2 ring-primary/30 object-cover" />
          <div>
            <div className="font-bold">{userData?.globalName || user.global_name || user.username}</div>
            <div className="text-sm text-muted-foreground">@{user.username}</div>
            {user.email && <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>}
          </div>
        </div>
      </div>

      {/* Premium */}
      <div className="bg-surface border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Subscription</h3>
        {userData?.premium?.active ? (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-semibold text-amber-400">{userData.premium.plan} Premium</div>
              {userData.premium.expiresAt && (
                <div className="text-xs text-muted-foreground">
                  Renews {new Date(userData.premium.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <Badge className="ml-auto bg-amber-500/15 text-amber-400 border-amber-500/30">Active</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Crown className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-semibold">Free Plan</div>
              <div className="text-xs text-muted-foreground">Upgrade for 24/7 mode, filters, lyrics, and more</div>
            </div>
            <Button size="sm" asChild
              className="ml-auto bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs gap-1">
              <a href="https://discord.gg/5gcFVbnxxF" target="_blank" rel="noopener noreferrer">
                <Crown className="w-3.5 h-3.5" /> Upgrade
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-surface border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Music2 className="w-4 h-4 text-primary" />, label: 'Songs Played', value: userData?.totalSongsPlayed ? String(userData.totalSongsPlayed) : 'No data available' },
            { icon: <Clock className="w-4 h-4 text-accent" />, label: 'Listen Time', value: userData?.totalListenTime ? fmtListenTime(userData.totalListenTime) : 'No data available' },
            { icon: <List className="w-4 h-4 text-violet-400" />, label: 'Playlists', value: userData?.savedPlaylists ? String(userData.savedPlaylists) : 'No data available' },
            { icon: <Heart className="w-4 h-4 text-rose-400" />, label: 'Favourites', value: userData?.favoriteSongs ? String(userData.favoriteSongs) : 'No data available' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">{s.icon}</div>
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-sm font-semibold">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-red-500/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-red-400/70 uppercase tracking-widest mb-4">Account</h3>
        <Button variant="outline" onClick={onLogout}
          className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 rounded-xl gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────── */
export default function Dashboard() {
  const [user, setUser]             = useState<DiscordUser | null>(null);
  const [userData, setUserData]     = useState<UserData | null>(null);
  const [guilds, setGuilds]         = useState<DiscordGuild[]>([]);
  const [playlists, setPlaylists]   = useState<Playlist[]>([]);
  const [activity, setActivity]     = useState<ActivityEntry[]>([]);
  const [activeTab, setActiveTab]   = useState<DashTab>('overview');
  const [authLoading, setAuthLoading] = useState(true);
  const [guildsLoading, setGuildsLoading]       = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [activityLoading, setActivityLoading]   = useState(false);
  const [managingGuild, setManagingGuild]       = useState<DiscordGuild | null>(null);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const data = await api<{ profile: DiscordUser; userData: UserData | null }>('/auth/me');
      if (!mountedRef.current) return;
      setUser(data.profile);
      setUserData(data.userData);
    } catch {
      if (mountedRef.current) setUser(null);
    } finally {
      if (mountedRef.current) setAuthLoading(false);
    }
  }, []);

  useEffect(() => { void checkAuth(); }, [checkAuth]);

  const loadGuilds = useCallback(async () => {
    setGuildsLoading(true);
    try {
      const data = await api<DiscordGuild[]>('/auth/guilds');
      if (mountedRef.current) setGuilds(data);
    } catch { /* unauthenticated */ }
    finally { if (mountedRef.current) setGuildsLoading(false); }
  }, []);

  const loadPlaylists = useCallback(async () => {
    setPlaylistsLoading(true);
    try {
      const data = await api<Playlist[]>('/playlists');
      if (mountedRef.current) setPlaylists(data);
    } catch { /* unauthenticated */ }
    finally { if (mountedRef.current) setPlaylistsLoading(false); }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await api<{ logs: ActivityEntry[] }>('/activity?limit=20');
      if (mountedRef.current) setActivity(data.logs);
    } catch { /* unauthenticated */ }
    finally { if (mountedRef.current) setActivityLoading(false); }
  }, []);

  // Load secondary data once authenticated
  useEffect(() => {
    if (!user) return;
    void loadGuilds();
    void loadPlaylists();
    void loadActivity();
  }, [user, loadGuilds, loadPlaylists, loadActivity]);

  const handleLogout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null); setUserData(null); setGuilds([]); setPlaylists([]); setActivity([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Connecting…</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const TABS: { id: DashTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',  icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'servers',   label: 'Servers',   icon: <Server className="w-4 h-4" /> },
    { id: 'music',     label: 'Music',     icon: <Music2 className="w-4 h-4" /> },
    { id: 'settings',  label: 'Settings',  icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="aurora-blob w-[600px] h-[600px] bg-primary/10 top-[-20%] left-[-10%] rounded-full" />
        <div className="aurora-blob w-[400px] h-[400px] bg-accent/8 bottom-[-10%] right-[-10%] rounded-full" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your bots and playlists</p>
          </div>
          <button className="md:hidden bg-surface border border-white/10 rounded-xl p-2"
            onClick={() => setSidebarOpen(o => !o)}>
            <Hash className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col gap-1 w-48 flex-shrink-0`}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === t.id
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
            <div className="mt-auto pt-4">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all w-full">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </div>

            {/* User pill */}
            <div className="flex items-center gap-2.5 bg-surface border border-white/5 rounded-xl px-3 py-2 mt-2">
              <img src={avatarUrl(user)} alt="" className="w-7 h-7 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user.username}</div>
                {userData?.premium?.active && (
                  <div className="text-[10px] text-amber-400 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />Premium
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                {activeTab === 'overview' && (
                  <OverviewTab user={user} userData={userData} guilds={guilds}
                    playlists={playlists} activity={activity} loadingActivity={activityLoading} />
                )}
                {activeTab === 'servers' && (
                  <ServersTab guilds={guilds} loading={guildsLoading}
                    onManage={g => { setManagingGuild(g); }} />
                )}
                {activeTab === 'music' && (
                  <MusicTab playlists={playlists} loading={playlistsLoading}
                    onRefresh={loadPlaylists} />
                )}
                {activeTab === 'settings' && (
                  <SettingsTab user={user} userData={userData} onLogout={handleLogout} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Server Settings Modal */}
      <AnimatePresence>
        {managingGuild && (
          <ServerSettingsModal guild={managingGuild} onClose={() => setManagingGuild(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

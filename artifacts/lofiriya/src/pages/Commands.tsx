import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Search, Copy, Check, ExternalLink, Terminal, Music2,
  Sliders, Wrench, ChevronRight, Play, Mic2, Clock, Zap,
  SkipForward, Volume2, Repeat, ListMusic, Shuffle, Radio,
  Square, UserCircle, Server, Info, Crown, Activity,
  Waves, Wind, Orbit, BarChart3, AudioWaveform, Hash,
  Headphones, RefreshCw, ArrowRight,
} from 'lucide-react';

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/5gcFVbnxxF';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED = [
  {
    name: '/play',
    desc: 'Play songs from supported platforms instantly.',
    example: '/play shape of you ed sheeran',
    icon: Play,
    color: 'from-violet-600/25 to-indigo-700/15',
    glow: 'rgba(139,92,246,0.3)',
    border: 'border-violet-500/25',
  },
  {
    name: '/lyrics',
    desc: 'Get synced lyrics for any currently playing track.',
    example: '/lyrics shape of you',
    icon: Mic2,
    color: 'from-cyan-600/20 to-blue-700/12',
    glow: 'rgba(6,182,212,0.25)',
    border: 'border-cyan-500/25',
  },
  {
    name: '/247',
    desc: 'Keep the player alive in your voice channel around the clock.',
    example: '/247',
    icon: Clock,
    color: 'from-emerald-600/20 to-teal-700/12',
    glow: 'rgba(16,185,129,0.25)',
    border: 'border-emerald-500/25',
  },
  {
    name: '/filter',
    desc: 'Apply premium audio effects — bass boost, nightcore, 8D and more.',
    example: '/filter nightcore',
    icon: Sliders,
    color: 'from-pink-600/20 to-rose-700/12',
    glow: 'rgba(236,72,153,0.25)',
    border: 'border-pink-500/25',
  },
];

interface Cmd {
  name: string;
  syntax: string;
  desc: string;
  example: string;
  category: 'General' | 'Music' | 'Filters';
  icon: React.ElementType;
  premium?: boolean;
}

const ALL_COMMANDS: Cmd[] = [
  // General
  { name: '/help',       syntax: '/help',              desc: 'Display the full help menu.',                    example: '/help',              category: 'General',   icon: Info },
  { name: '/invite',     syntax: '/invite',            desc: 'Get the invite link to add LOFIRIYA.',           example: '/invite',            category: 'General',   icon: ExternalLink },
  { name: '/ping',       syntax: '/ping',              desc: 'Check current bot latency.',                     example: '/ping',              category: 'General',   icon: Activity },
  { name: '/premium',    syntax: '/premium',           desc: 'View premium plans and benefits.',               example: '/premium',           category: 'General',   icon: Crown },
  { name: '/setprefix',  syntax: '/setprefix <prefix>',desc: 'Change the command prefix for this server.',     example: '/setprefix !',       category: 'General',   icon: Hash },
  { name: '/stats',      syntax: '/stats',             desc: 'Display global bot statistics.',                 example: '/stats',             category: 'General',   icon: BarChart3 },
  { name: '/updates',    syntax: '/updates',           desc: 'View the latest bot updates and changelog.',     example: '/updates',           category: 'General',   icon: RefreshCw },
  { name: '/uptime',     syntax: '/uptime',            desc: 'Check how long the bot has been online.',        example: '/uptime',            category: 'General',   icon: Clock },
  { name: '/userinfo',   syntax: '/userinfo [@user]',  desc: 'Show information about a Discord user.',         example: '/userinfo @rommu',   category: 'General',   icon: UserCircle },
  { name: '/serverinfo', syntax: '/serverinfo',        desc: 'Display details about this server.',             example: '/serverinfo',        category: 'General',   icon: Server },
  { name: '/avatar',     syntax: '/avatar [@user]',    desc: 'View the full-size avatar of any user.',         example: '/avatar @rommu',     category: 'General',   icon: UserCircle },
  // Music
  { name: '/247',        syntax: '/247',               desc: 'Toggle 24/7 mode to stay in the voice channel.', example: '/247',             category: 'Music',     icon: Clock,         premium: true },
  { name: '/autoplay',   syntax: '/autoplay',          desc: 'Toggle smart autoplay when the queue ends.',     example: '/autoplay',          category: 'Music',     icon: Radio },
  { name: '/clearqueue', syntax: '/clearqueue',        desc: 'Remove all tracks from the current queue.',      example: '/clearqueue',        category: 'Music',     icon: Square },
  { name: '/dj',         syntax: '/dj <role>',         desc: 'Set a DJ role to gate music controls.',          example: '/dj @DJ',            category: 'Music',     icon: Headphones },
  { name: '/filter',     syntax: '/filter <effect>',   desc: 'Apply an audio filter to the current track.',    example: '/filter bassboost',  category: 'Music',     icon: Sliders,       premium: true },
  { name: '/join',       syntax: '/join',              desc: 'Invite the bot to your voice channel.',          example: '/join',              category: 'Music',     icon: ArrowRight },
  { name: '/leave',      syntax: '/leave',             desc: 'Disconnect the bot from the voice channel.',     example: '/leave',             category: 'Music',     icon: ArrowRight },
  { name: '/loop',       syntax: '/loop [track|queue]',desc: 'Toggle loop mode for track or queue.',           example: '/loop track',        category: 'Music',     icon: Repeat },
  { name: '/lyrics',     syntax: '/lyrics [song]',     desc: 'Fetch synced lyrics for the current track.',     example: '/lyrics',            category: 'Music',     icon: Mic2,          premium: true },
  { name: '/move',       syntax: '/move <from> <to>',  desc: 'Move a track to a different queue position.',    example: '/move 3 1',          category: 'Music',     icon: ArrowRight },
  { name: '/nowplaying', syntax: '/nowplaying',        desc: 'Display info about the currently playing track.',example: '/nowplaying',        category: 'Music',     icon: Music2 },
  { name: '/pause',      syntax: '/pause',             desc: 'Pause the current track.',                       example: '/pause',             category: 'Music',     icon: Square },
  { name: '/play',       syntax: '/play <song | URL>',  desc: 'Play a track or add it to the queue.',          example: '/play heat waves',   category: 'Music',     icon: Play },
  { name: '/playtop',    syntax: '/playtop <song>',    desc: 'Add a song to the top of the queue.',            example: '/playtop starboy',   category: 'Music',     icon: SkipForward },
  { name: '/previous',   syntax: '/previous',          desc: 'Go back to the previous track.',                 example: '/previous',          category: 'Music',     icon: SkipForward },
  { name: '/queue',      syntax: '/queue [page]',      desc: 'View the current song queue.',                   example: '/queue',             category: 'Music',     icon: ListMusic },
  { name: '/remove',     syntax: '/remove <position>', desc: 'Remove a track from the queue by position.',     example: '/remove 3',          category: 'Music',     icon: Square },
  { name: '/resume',     syntax: '/resume',            desc: 'Resume a paused track.',                         example: '/resume',            category: 'Music',     icon: Play },
  { name: '/search',     syntax: '/search <query>',    desc: 'Search for tracks and pick from results.',       example: '/search believer',   category: 'Music',     icon: Search },
  { name: '/seek',       syntax: '/seek <timestamp>',  desc: 'Jump to any position in the current track.',     example: '/seek 1:30',         category: 'Music',     icon: SkipForward },
  { name: '/shuffle',    syntax: '/shuffle',           desc: 'Shuffle all tracks in the queue randomly.',      example: '/shuffle',           category: 'Music',     icon: Shuffle },
  { name: '/skip',       syntax: '/skip [amount]',     desc: 'Skip one or more tracks in the queue.',          example: '/skip 2',            category: 'Music',     icon: SkipForward },
  { name: '/stop',       syntax: '/stop',              desc: 'Stop playback and clear the queue.',             example: '/stop',              category: 'Music',     icon: Square },
  { name: '/syncedlyrics',syntax: '/syncedlyrics',     desc: 'Display real-time synced lyrics as the track plays.', example: '/syncedlyrics', category: 'Music',    icon: Activity,      premium: true },
  { name: '/volume',     syntax: '/volume <1–200>',    desc: 'Set playback volume (up to 200%).',              example: '/volume 80',         category: 'Music',     icon: Volume2,       premium: true },
  // Filters
  { name: '/bassboost',  syntax: '/filter bassboost',  desc: 'Deep, punchy bass enhancement — 4 levels.',      example: '/filter bassboost',  category: 'Filters',   icon: AudioWaveform },
  { name: '/nightcore',  syntax: '/filter nightcore',  desc: 'Speed and pitch-up — the classic internet effect.',example: '/filter nightcore', category: 'Filters',   icon: Zap },
  { name: '/vaporwave',  syntax: '/filter vaporwave',  desc: 'Slowed and pitched-down lo-fi aesthetic.',        example: '/filter vaporwave',  category: 'Filters',   icon: Wind },
  { name: '/8d',         syntax: '/filter 8d',         desc: 'Immersive 8D panning that rotates the stereo field.',example: '/filter 8d',      category: 'Filters',   icon: Orbit },
  { name: '/karaoke',    syntax: '/filter karaoke',    desc: 'Reduces vocals to create a karaoke experience.',  example: '/filter karaoke',    category: 'Filters',   icon: Mic2 },
  { name: '/tremolo',    syntax: '/filter tremolo',    desc: 'Volume modulation for a vintage tremolo effect.',  example: '/filter tremolo',    category: 'Filters',   icon: Waves },
  { name: '/rotation',   syntax: '/filter rotation',   desc: 'Smooth stereo rotation for spatial audio.',        example: '/filter rotation',   category: 'Filters',   icon: Orbit },
  { name: '/equalizer',  syntax: '/filter equalizer',  desc: 'Full 15-band EQ to shape your sound.',            example: '/filter equalizer',  category: 'Filters',   icon: BarChart3 },
];

const CATEGORIES = ['All', 'General', 'Music', 'Filters'] as const;

const FILTER_SHOWCASE = [
  { label: 'Bass Boost',  icon: AudioWaveform, color: 'from-violet-500/20 to-purple-700/10', border: 'border-violet-500/20', effect: 'Deep bass punch' },
  { label: 'Nightcore',   icon: Zap,           color: 'from-cyan-500/20 to-blue-600/10',     border: 'border-cyan-500/20',   effect: 'Speed + pitch up' },
  { label: 'Vaporwave',   icon: Wind,          color: 'from-pink-500/20 to-rose-700/10',      border: 'border-pink-500/20',   effect: 'Slowed + lo-fi' },
  { label: '8D Audio',    icon: Orbit,         color: 'from-emerald-500/20 to-teal-700/10',  border: 'border-emerald-500/20',effect: 'Rotating stereo' },
  { label: 'Karaoke',     icon: Mic2,          color: 'from-amber-500/20 to-yellow-700/10',  border: 'border-amber-500/20',  effect: 'Vocal removal' },
  { label: 'Tremolo',     icon: Waves,         color: 'from-indigo-500/20 to-blue-700/10',   border: 'border-indigo-500/20', effect: 'Volume wave' },
  { label: 'Rotation',    icon: Orbit,         color: 'from-teal-500/20 to-emerald-700/10',  border: 'border-teal-500/20',   effect: 'Stereo spin' },
  { label: 'Equalizer',   icon: BarChart3,     color: 'from-orange-500/20 to-red-700/10',    border: 'border-orange-500/20', effect: '15-band EQ' },
];

const TERMINAL_EXAMPLES = [
  { input: '/play perfect ed sheeran',  comment: '# Search and play a track' },
  { input: '/lyrics shape of you',      comment: '# Fetch synced lyrics' },
  { input: '/filter nightcore',         comment: '# Apply nightcore effect' },
  { input: '/volume 100',               comment: '# Set volume to 100%' },
  { input: '/seek 1:30',                comment: '# Jump to 1 minute 30 seconds' },
  { input: '/queue',                    comment: '# View the current queue' },
];

const GUIDE_STEPS = [
  { step: '01', title: 'Join a Voice Channel', desc: 'Hop into any voice channel in your Discord server.', icon: Headphones },
  { step: '02', title: 'Use /play',            desc: 'Type /play followed by a song name or URL to start the music.', icon: Play },
  { step: '03', title: 'Enjoy the Music',      desc: 'Sit back and enjoy crystal-clear, uninterrupted playback.', icon: Music2 },
];

const SHORTCUTS = [
  { title: 'Music Playback', cmds: ['/play', '/pause', '/resume', '/stop'], icon: Music2,  color: 'text-violet-400' },
  { title: 'Autoplay',       cmds: ['/autoplay', '/shuffle', '/loop', '/247'], icon: Radio,   color: 'text-cyan-400' },
  { title: 'Volume',         cmds: ['/volume', '/bassboost', '/filter', '/equalizer'], icon: Volume2, color: 'text-emerald-400' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary/15 border border-white/8 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all duration-200 font-mono text-xs flex-shrink-0"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied
          ? <motion.span key="c" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-green-400"><Check className="w-3 h-3" />Copied</motion.span>
          : <motion.span key="u" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-1"><Copy className="w-3 h-3" />Copy</motion.span>
        }
      </AnimatePresence>
    </button>
  );
}

function CommandCard({ cmd, index }: { cmd: Cmd; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3 }}
      className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/7 hover:border-primary/35 hover:bg-white/[0.05] hover:shadow-[0_0_22px_theme(colors.primary.DEFAULT/0.11)] transition-all duration-300"
      style={{ willChange: 'transform' }}
    >
      {/* Category + premium badge row */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
          cmd.category === 'Music' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' :
          cmd.category === 'Filters' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
          'bg-white/8 text-white/40 border border-white/10'
        }`}>
          {cmd.category}
        </span>
        {cmd.premium && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Crown className="w-2.5 h-2.5" />Premium
          </span>
        )}
      </div>

      {/* Icon + Name */}
      <div className="flex items-start gap-3 mb-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/18 group-hover:scale-105 transition-all duration-300">
          <cmd.icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-primary text-sm">{cmd.name}</h3>
          <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{cmd.desc}</p>
        </div>
      </div>

      {/* Syntax + copy */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5">
        <code className="text-xs text-accent/70 font-mono truncate">{cmd.syntax}</code>
        <CopyButton text={cmd.syntax} />
      </div>

      {/* Hover corner glow */}
      <div className="absolute bottom-0 right-0 w-20 h-20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 100%, rgba(139,92,246,0.07), transparent 70%)' }} />
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Commands() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('All');
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_COMMANDS.filter(cmd => {
      const matchSearch = !q || cmd.name.includes(q) || cmd.desc.toLowerCase().includes(q) || cmd.example.toLowerCase().includes(q);
      const matchCat = activeCategory === 'All' || cmd.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [search, activeCategory]);

  const catCount = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_COMMANDS.length };
    CATEGORIES.slice(1).forEach(cat => {
      counts[cat] = ALL_COMMANDS.filter(c => c.category === cat).length;
    });
    return counts;
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">

      {/* Ambient bg */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="aurora-blob w-[600px] h-[600px] bg-primary/10 -top-[15%] -left-[10%] rounded-full" />
        <div className="aurora-blob w-[450px] h-[450px] bg-accent/7 top-[45%] -right-[8%] rounded-full" style={{ animationDelay: '-9s', animationDuration: '25s' }} />
      </div>

      <div className="relative z-10">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="pt-32 pb-12 text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-6">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Command Reference</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-white leading-tight mb-5 max-w-4xl mx-auto">
              Master Every{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                Command
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Explore LOFIRIYA's complete command collection — powerful music controls, server utilities, premium tools and advanced DJ features.
            </p>
            {/* stat pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {[['40+', 'Commands'], ['4', 'Categories'], ['8', 'Audio Filters'], ['50ms', 'Avg Response']].map(([val, label]) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/4 border border-white/8 text-sm">
                  <span className="font-display font-bold text-white">{val}</span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══ SEARCH + FILTERS ══════════════════════════════════════════════ */}
        <section className="pb-6 px-4 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
            {/* Search bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
              <input
                ref={searchRef}
                placeholder="Search commands..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-32 h-14 bg-white/[0.04] border border-white/10 focus:border-primary/50 rounded-2xl text-white text-base placeholder:text-muted-foreground/60 outline-none focus:shadow-[0_0_0_3px_theme(colors.primary.DEFAULT/0.12)] transition-all font-sans"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {search && (
                  <button onClick={() => setSearch('')} className="text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded bg-white/5">
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/50 border border-white/10 rounded px-1.5 py-0.5 font-mono">
                  <span>/</span>
                </kbd>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-primary text-white shadow-[0_0_16px_theme(colors.primary.DEFAULT/0.4)]'
                        : 'bg-white/4 border border-white/8 text-white/55 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {cat}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-white/8 text-muted-foreground'}`}>
                      {catCount[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ══ FEATURED COMMANDS ═════════════════════════════════════════════ */}
        {activeCategory === 'All' && !search && (
          <section className="py-10 px-4 max-w-7xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs font-bold text-primary uppercase tracking-widest mb-5"
            >
              Featured Commands
            </motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURED.map((f, i) => (
                <motion.div
                  key={f.name}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                  className={`relative p-5 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} group hover:scale-[1.02] transition-transform duration-300 cursor-default`}
                  style={{ willChange: 'transform' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 30px 0 ${f.glow}`)}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-white text-lg mb-1">{f.name}</h3>
                  <p className="text-sm text-white/55 leading-relaxed mb-4">{f.desc}</p>
                  <code className="text-xs text-white/35 font-mono">{f.example}</code>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ══ COMMAND GRID ══════════════════════════════════════════════════ */}
        <section className="pb-8 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
              {filtered.length} command{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && ` · ${activeCategory}`}
              {search && ` matching "${search}"`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={`${activeCategory}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              >
                {filtered.map((cmd, i) => (
                  <CommandCard key={cmd.name + cmd.category} cmd={cmd} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 text-muted-foreground"
              >
                <Terminal className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-base font-medium">No commands found</p>
                <p className="text-sm mt-1 opacity-60">Try a different search term or category</p>
                <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="mt-4 text-sm text-primary hover:underline">
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ══ FILTER SHOWCASE ═══════════════════════════════════════════════ */}
        <section className="py-16 px-4 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Audio Filters</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">Transform Your Sound</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">Apply any filter instantly with <code className="text-primary font-mono">/filter &lt;name&gt;</code> — combine effects for a unique listening experience.</p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {FILTER_SHOWCASE.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} group hover:scale-105 transition-transform duration-300 cursor-default`}
                  style={{ willChange: 'transform' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-xs">{f.label}</p>
                    <p className="text-white/35 text-[10px] mt-0.5">{f.effect}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TERMINAL EXAMPLES ═════════════════════════════════════════════ */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Usage Examples</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">See It In Action</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">Real command examples you can copy and use directly in your server.</p>
            </motion.div>

            {/* Terminal window */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-[#080a14] border border-white/8 overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.4)]"
            >
              {/* Traffic-light header */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="ml-4 text-xs text-white/25 font-mono"># lofiriya — examples</div>
              </div>

              <div className="p-5 space-y-2">
                {TERMINAL_EXAMPLES.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-primary/40 font-mono text-sm flex-shrink-0">$</span>
                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <code className="text-primary font-mono text-sm">{ex.input}</code>
                      <span className="text-muted-foreground/50 font-mono text-xs">{ex.comment}</span>
                    </div>
                    <CopyButton text={ex.input} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ 3-STEP GUIDE ══════════════════════════════════════════════════ */}
        <section className="py-16 px-4 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Quick Start</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">Up And Running In Seconds</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">Getting started with LOFIRIYA is as simple as three steps.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">

              {GUIDE_STEPS.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-primary/25 transition-all group"
                >
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                      <step.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_theme(colors.primary.DEFAULT/0.5)]">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SHORTCUTS ═════════════════════════════════════════════════════ */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Quick Reference</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">Command Shortcuts</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SHORTCUTS.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/12 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <h3 className="font-display font-semibold text-white text-sm">{s.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {s.cmds.map(cmd => (
                      <div key={cmd} className="px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/6 font-mono text-xs text-primary/80">
                        {cmd}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BOTTOM CTA ════════════════════════════════════════════════════ */}
        <section className="py-16 px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-primary/25 bg-gradient-to-br from-primary/12 via-background to-accent/8 p-10 md:p-14 text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/18 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-64 h-20 bg-accent/12 blur-3xl pointer-events-none" />

              <div className="relative inline-flex w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 items-center justify-center mb-6 mx-auto shadow-[0_0_22px_theme(colors.primary.DEFAULT/0.3)]">
                <Music2 className="w-6 h-6 text-primary" />
              </div>

              <h2 className="relative text-3xl md:text-4xl font-display font-extrabold text-white mb-4 leading-tight">
                Ready To Experience{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">LOFIRIYA?</span>
              </h2>
              <p className="relative text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                Invite the bot and unlock powerful music features for your server today.
              </p>

              <div className="relative flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white px-7 h-12 font-medium shadow-[0_0_20px_theme(colors.primary.DEFAULT/0.4)] hover:shadow-[0_0_30px_theme(colors.primary.DEFAULT/0.6)] transition-all gap-2"
                  onClick={() => window.open(INVITE_URL, '_blank')}
                >
                  Invite Bot <ExternalLink className="w-4 h-4" />
                </Button>
                <Link href="/premium">
                  <Button size="lg" variant="outline" className="border-white/12 hover:bg-white/5 px-7 h-12 font-medium gap-2 bg-white/[0.03]">
                    <Crown className="w-4 h-4 text-amber-400" />
                    View Premium
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/60 hover:text-white hover:bg-white/5 px-7 h-12 font-medium gap-2"
                  onClick={() => window.open(SUPPORT_URL, '_blank')}
                >
                  Join Support Server
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}

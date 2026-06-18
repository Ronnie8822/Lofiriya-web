import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Music2, Play, Sliders, FileText, Disc3, Settings2, Crown,
  Zap, Search, ListMusic, Repeat, SkipForward, Volume2, RotateCcw,
  Mic2, Globe, Eye, Gauge, Shield, Star, Terminal, ChevronRight,
  Waves, Radio, Headphones, Clock, Shuffle, Activity, ExternalLink,
  AudioWaveform, Wind, Orbit, BarChart3, Music, SlidersHorizontal,
} from 'lucide-react';

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'music',    label: 'Music',    icon: Music2 },
  { id: 'playback', label: 'Playback', icon: Play },
  { id: 'filters',  label: 'Filters',  icon: Sliders },
  { id: 'lyrics',   label: 'Lyrics',   icon: FileText },
  { id: 'premium',  label: 'Premium',  icon: Crown },
];

// ─── Feature content per tab ─────────────────────────────────────────────────
const TAB_CONTENT: Record<string, { title: string; desc: string; icon: React.ElementType; badge?: string }[]> = {
  music: [
    { title: 'High-Fidelity Streaming', desc: 'Crystal-clear music playback powered by Lavalink — zero compression, zero compromise.', icon: AudioWaveform, badge: 'Core' },
    { title: 'Smart Search',            desc: 'Search tracks instantly from multiple sources by title, artist or URL.', icon: Search },
    { title: 'Playlist Support',        desc: 'Load large playlists of hundreds of songs without lag or queueing errors.', icon: ListMusic },
    { title: 'Queue Management',        desc: 'Manage queues up to 1 000 songs — shuffle, move, remove and save at will.', icon: Music2 },
    { title: 'Fast Track Loading',      desc: 'Lightning-fast response times — most tracks load in under a second.', icon: Zap, badge: 'Fast' },
    { title: 'Multi-Source Support',    desc: 'Play music from YouTube, SoundCloud, Bandcamp and direct stream URLs.', icon: Globe },
  ],
  playback: [
    { title: '24/7 Mode',       desc: 'Keep the bot alive in your voice channel around the clock without timeout.', icon: Clock, badge: 'Popular' },
    { title: 'Auto Resume',     desc: 'Automatically continues playback after unexpected disconnects or restarts.', icon: RotateCcw },
    { title: 'Loop Modes',      desc: 'Loop a single track, loop the entire queue, or disable — your call.', icon: Repeat },
    { title: 'Autoplay',        desc: 'Smart auto-recommendations keep the music going when your queue ends.', icon: Radio },
    { title: 'Seek Controls',   desc: 'Jump to any timestamp in a track with precise second-level seek support.', icon: SkipForward },
    { title: 'Volume Boost',    desc: 'Fine-tune or boost volume up to 200% for the perfect listening level.', icon: Volume2 },
  ],
  filters: [
    { title: 'Bass Boost',   desc: 'Deep, punchy bass enhancement across four intensity levels.', icon: AudioWaveform, badge: 'Fan fave' },
    { title: 'Nightcore',    desc: 'Classic speed and pitch-up effect — the internet staple.', icon: Zap },
    { title: 'Vaporwave',    desc: 'Slowed, pitched-down lo-fi aesthetic mode.', icon: Wind },
    { title: '8D Audio',     desc: 'Immersive panning that rotates the stereo field around you.', icon: Orbit },
    { title: 'Tremolo',      desc: 'Volume modulation for that vintage tremolo effect.', icon: Waves },
    { title: 'Karaoke',      desc: 'Centre-channel reduction to strip out vocals from any track.', icon: Mic2 },
    { title: 'Rotation',     desc: 'Smooth left-right audio rotation for a spatial experience.', icon: Orbit },
    { title: 'Equalizer',    desc: 'Full 15-band EQ — shape your sound however you want.', icon: BarChart3, badge: 'Pro' },
  ],
  lyrics: [
    { title: 'Instant Lyrics',          desc: 'Fetch the full lyrics for any currently playing track in seconds.', icon: FileText, badge: 'New' },
    { title: 'Synced Lyrics',           desc: 'Follow along in real time — lyrics scroll in sync with the music.', icon: Activity },
    { title: 'Multi-Language Support',  desc: 'Works with tracks in supported languages wherever lyrics are available.', icon: Globe },
    { title: 'Clean Interface',         desc: 'Formatted, easy-to-read lyric display directly in Discord.', icon: Eye },
  ],
  premium: [
    { title: 'Volume Up to 200%', desc: 'Push the volume up to 200% for the perfect listening level in your server.', icon: Volume2 },
    { title: 'Custom Presets',    desc: 'Save your filter + EQ combinations as named presets.', icon: SlidersHorizontal },
    { title: 'Early Access',      desc: 'Be first to try new features before they roll out publicly.', icon: Star },
    { title: 'Priority Support',  desc: 'Skip the queue — get answers from our team within hours.', icon: Headphones },
    { title: 'Unlimited Queue',   desc: 'No queue caps — load your entire library if you want.', icon: ListMusic },
  ],
};

// ─── Why cards ───────────────────────────────────────────────────────────────
const WHY_CARDS = [
  { title: 'High Performance', desc: 'Ultra-fast music playback using dedicated Lavalink nodes. Tracks start in under a second.', icon: Zap, color: 'from-violet-500/20 to-indigo-600/10', border: 'border-violet-500/20' },
  { title: 'Reliable Uptime',  desc: '99.9% uptime guarantee — monitored around the clock so your server is never silent.', icon: Activity, color: 'from-emerald-500/20 to-teal-600/10', border: 'border-emerald-500/20' },
  { title: 'Advanced Features', desc: 'From 8D audio and equalizer to vote-skip and 24/7 mode — tools for every community.', icon: Sliders, color: 'from-cyan-500/20 to-blue-600/10', border: 'border-cyan-500/20' },
  { title: 'Premium Experience', desc: 'Built and maintained for servers that demand the absolute best in music quality.', icon: Crown, color: 'from-amber-500/20 to-orange-600/10', border: 'border-amber-500/20' },
];

// ─── Command preview data ─────────────────────────────────────────────────────
const COMMANDS = [
  { name: '/play',    args: '<song | URL>',       desc: 'Play a track or add it to the queue' },
  { name: '/247',     args: '',                    desc: 'Toggle 24/7 mode — stay in voice forever' },
  { name: '/filter',  args: '<effect>',            desc: 'Apply an audio filter to the current track' },
  { name: '/queue',   args: '[page]',              desc: 'View the current song queue' },
  { name: '/skip',    args: '[amount]',            desc: 'Skip one or more tracks in the queue' },
  { name: '/volume',  args: '<1–200>',             desc: 'Set playback volume (200% max on free)' },
  { name: '/lyrics',  args: '[song]',              desc: 'Fetch synced lyrics for the current track' },
  { name: '/seek',    args: '<timestamp>',         desc: 'Jump to any position in the current track' },
];

// ─── Floating note positions (CSS only, no JS) ────────────────────────────────
const NOTES = ['♪', '♫', '♩', '♬', '♪', '♫'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCard({ item, index }: { item: typeof TAB_CONTENT['music'][0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.35, ease: 'easeOut' }}
      className="relative group p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-primary/40 hover:bg-white/[0.055] hover:shadow-[0_0_28px_theme(colors.primary.DEFAULT/0.14)] transition-all duration-300 cursor-default"
      style={{ willChange: 'transform' }}
    >
      {/* Badge */}
      {item.badge && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/25">
          {item.badge}
        </span>
      )}

      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
        <item.icon className="w-5 h-5 text-primary" />
      </div>

      <h3 className="font-display font-bold text-white text-base mb-2 leading-snug">{item.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>

      {/* Hover glow corner */}
      <div className="absolute bottom-0 right-0 w-24 h-24 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 100%, rgba(139,92,246,0.08), transparent 70%)' }} />
    </motion.div>
  );
}

function CommandCard({ cmd, index }: { cmd: typeof COMMANDS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative p-5 rounded-xl bg-[#0d0f1a] border border-white/8 hover:border-primary/35 hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT/0.12)] transition-all duration-300 font-mono overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-3">
        <span className="text-primary/40 text-sm mt-0.5 flex-shrink-0">$</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
            <span className="text-primary font-bold text-sm">{cmd.name}</span>
            {cmd.args && <span className="text-accent/70 text-xs">{cmd.args}</span>}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">{cmd.desc}</p>
        </div>
        <Terminal className="w-3.5 h-3.5 text-white/10 group-hover:text-primary/30 transition-colors flex-shrink-0 mt-0.5" />
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Features() {
  const [activeTab, setActiveTab] = useState('music');
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll tabs into view on mobile when tab changes
  useEffect(() => {
    if (tabsRef.current) {
      const active = tabsRef.current.querySelector('[data-active="true"]') as HTMLElement;
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const currentItems = TAB_CONTENT[activeTab] ?? [];
  const cols = currentItems.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : currentItems.length >= 8 ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">

      {/* ── Ambient background ─────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="aurora-blob w-[700px] h-[700px] bg-primary/12 -top-[20%] -left-[15%] rounded-full" />
        <div className="aurora-blob w-[500px] h-[500px] bg-accent/8 top-[50%] -right-[10%] rounded-full" style={{ animationDelay: '-10s', animationDuration: '28s' }} />
      </div>

      {/* ── Floating music notes (CSS animation) ──────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        {NOTES.map((n, i) => (
          <span
            key={i}
            className="absolute text-primary/8 font-bold select-none"
            style={{
              left: `${10 + i * 16}%`,
              top: `${20 + (i % 3) * 22}%`,
              fontSize: `${1.4 + (i % 3) * 0.8}rem`,
              animation: `aurora ${14 + i * 3}s ease-in-out ${i * 2}s infinite alternate`,
              filter: 'blur(0.5px)',
            }}
          >
            {n}
          </span>
        ))}
      </div>

      <div className="relative z-10">

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HERO                                                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="pt-32 pb-16 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-6">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">All Features</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-white leading-tight mb-5 max-w-4xl mx-auto">
              Powerful Features For{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                Every Music Lover
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Discover everything LOFIRIYA can do for your server — built for high-quality music, advanced controls and premium customization.
            </p>

            {/* Quick stat pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {[['7', 'Feature Categories'], ['50+', 'Commands'], ['8', 'Audio Filters'], ['99.9%', 'Uptime']].map(([val, label]) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/4 border border-white/8 text-sm">
                  <span className="font-display font-bold text-white">{val}</span>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TABS + FEATURE GRID                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="pb-20 px-4">
          <div className="max-w-7xl mx-auto">

            {/* Tab bar — horizontally scrollable on mobile */}
            <div
              ref={tabsRef}
              className="flex gap-1.5 overflow-x-auto pb-2 mb-10 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-active={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                      active
                        ? 'bg-primary text-white shadow-[0_0_18px_theme(colors.primary.DEFAULT/0.45)]'
                        : 'bg-white/4 border border-white/8 text-white/55 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Feature cards grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className={`grid grid-cols-1 ${cols} gap-4`}
              >
                {currentItems.map((item, i) => (
                  <FeatureCard key={item.title} item={item} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* WHY CHOOSE LOFIRIYA                                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Why LOFIRIYA</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Built Different. Sounds Better.
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                We obsess over every detail so your community gets the best listening experience on Discord.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {WHY_CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} group hover:scale-[1.02] transition-transform duration-300`}
                  style={{ willChange: 'transform' }}
                >
                  <div className="w-11 h-11 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center mb-5">
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2">{card.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COMMAND PREVIEW                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Command Reference</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Simple Commands. Powerful Results.
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                All commands use Discord's slash-command interface — no prefix to remember, fully autocompleted.
              </p>
            </motion.div>

            {/* Terminal window frame */}
            <div className="rounded-2xl bg-[#080a14] border border-white/8 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
              {/* Traffic-light bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="ml-4 text-xs text-white/25 font-mono"># lofiriya — commands</div>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {COMMANDS.map((cmd, i) => (
                  <CommandCard key={cmd.name} cmd={cmd} index={i} />
                ))}
              </div>

              <div className="px-5 pb-5 text-center">
                <Link href="/commands">
                  <button className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                    View all commands
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM CTA                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-primary/25 bg-gradient-to-br from-primary/12 via-background to-accent/8 p-10 md:p-16 text-center"
            >
              {/* Glow orbs */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-64 h-24 bg-accent/15 blur-3xl pointer-events-none" />

              {/* Crown icon */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 shadow-[0_0_24px_theme(colors.primary.DEFAULT/0.3)] mb-7 mx-auto">
                <Crown className="w-7 h-7 text-primary" />
              </div>

              <h2 className="relative text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-white mb-4 leading-tight">
                Unlock The Full{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  LOFIRIYA Experience
                </span>
              </h2>

              <p className="relative text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                Get access to advanced controls, premium audio filters, unlimited queues, custom presets and priority support — built for serious communities.
              </p>

              <div className="relative flex flex-wrap justify-center gap-4">
                <Link href="/premium">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white px-8 h-12 font-medium shadow-[0_0_22px_theme(colors.primary.DEFAULT/0.45)] hover:shadow-[0_0_32px_theme(colors.primary.DEFAULT/0.65)] transition-all gap-2"
                    data-testid="features-cta-premium"
                  >
                    <Crown className="w-4 h-4" />
                    View Premium Plans
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/12 hover:bg-white/5 px-8 h-12 font-medium gap-2 bg-white/[0.03]"
                  onClick={() => window.open(INVITE_URL, '_blank')}
                  data-testid="features-cta-invite"
                >
                  Invite Bot
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}

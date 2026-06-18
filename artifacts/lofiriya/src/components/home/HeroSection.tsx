import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Sparkles, Music2, Heart, ChevronDown, ChevronUp,
} from 'lucide-react';
import { SiDiscord } from 'react-icons/si';
import mascotImg from "@assets/20260615_035917_1781590040213.jpg";

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/5gcFVbnxxF';

const subtexts = [
  'Crystal Clear Audio',
  'Premium Playback',
  'Smarter Music Streaming',
  'Ultimate Discord Music',
];

interface Track {
  title: string;
  artist: string;
  searchQuery: string;
  previewUrl: string | null;
  duration: number;
  color: string;
  gradient: string;
}

// Reliable iTunes search queries — ordered by expected result quality
const PLAYLIST_CONFIG = [
  { title: 'Shape Of You',    artist: 'Ed Sheeran',      searchQuery: 'Shape Of You Ed Sheeran',            color: '#7C3AED', gradient: 'from-violet-600 via-purple-700 to-indigo-800' },
  { title: 'Sapphire',        artist: 'Ryan Taubert',    searchQuery: 'Sapphire Ryan Taubert',               color: '#0284C7', gradient: 'from-sky-500 via-blue-600 to-cyan-800' },
  { title: 'Blinding Lights', artist: 'The Weeknd',      searchQuery: 'Blinding Lights Weeknd',              color: '#9333EA', gradient: 'from-purple-600 via-violet-700 to-indigo-900' },
  { title: 'Heat Waves',      artist: 'Glass Animals',   searchQuery: 'Heat Waves Glass Animals',            color: '#06B6D4', gradient: 'from-cyan-500 via-teal-600 to-blue-800' },
  { title: 'Starboy',         artist: 'The Weeknd',      searchQuery: 'Starboy Weeknd',                      color: '#2563EB', gradient: 'from-blue-600 via-indigo-700 to-violet-900' },
  { title: 'Believer',        artist: 'Imagine Dragons', searchQuery: 'Believer Imagine Dragons',            color: '#DC2626', gradient: 'from-red-600 via-rose-700 to-pink-900' },
  { title: 'Perfect',         artist: 'Ed Sheeran',      searchQuery: 'Perfect Ed Sheeran',                  color: '#4F46E5', gradient: 'from-indigo-500 via-blue-600 to-purple-800' },
  { title: 'Dracula',         artist: 'Rina Sawayama',   searchQuery: 'Rina Sawayama Sawayama',              color: '#BE185D', gradient: 'from-pink-600 via-rose-700 to-purple-900' },
];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Animated equalizer bars
function EqBars({ playing }: { playing: boolean }) {
  const heights = [0.4, 0.9, 0.6, 1.0, 0.7, 1.2, 0.5, 0.8, 1.1, 0.65, 0.95, 0.75];
  return (
    <div className="flex items-end gap-0.5 h-5" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-accent transition-all"
          style={{
            height: playing ? `${Math.max(h * 16, 3)}px` : '3px',
            animation: playing
              ? `waveBar ${0.28 + (i % 6) * 0.08}s ease-in-out ${i * 0.045}s infinite alternate`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

export function HeroSection() {
  const [currentSubtext, setCurrentSubtext] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(() =>
    PLAYLIST_CONFIG.map(t => ({ ...t, previewUrl: null, duration: 30 }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // ── Fetch iTunes previews ──
  useEffect(() => {
    let cancelled = false;

    const fetchOne = async (cfg: typeof PLAYLIST_CONFIG[0]): Promise<Track> => {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(cfg.searchQuery)}&media=music&limit=3&country=US`
        );
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        // Pick the first result that has a previewUrl
        const item = (data.results as Array<{ previewUrl?: string; trackTimeMillis?: number }>)
          .find(r => r.previewUrl);
        return {
          ...cfg,
          previewUrl: item?.previewUrl ?? null,
          duration: item?.trackTimeMillis ? item.trackTimeMillis / 1000 : 30,
        };
      } catch {
        return { ...cfg, previewUrl: null, duration: 30 };
      }
    };

    (async () => {
      // Fetch all in parallel, then update state once
      const results = await Promise.all(PLAYLIST_CONFIG.map(fetchOne));
      if (!cancelled) setTracks(results);
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Audio element ──
  useEffect(() => {
    // No crossOrigin — iTunes previews don't need it and it can cause CORS failures
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = 0.8;
    audioRef.current = audio;

    const onEnded = () => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % tracksRef.current.length;
        // Give React time to update before loading next
        setTimeout(() => loadTrackByIndex(next, true), 50);
        return next;
      });
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => { if (isFinite(audio.duration)) setDuration(audio.duration); };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.pause();
      audio.src = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrackByIndex = useCallback((index: number, autoplay = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = tracksRef.current[index];

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setLiked(false);

    if (!track?.previewUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    audio.src = track.previewUrl;
    audio.load();

    const onCanPlay = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
      setIsLoading(false);
      if (autoplay) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      // Auto-advance on error
      if (autoplay) {
        const next = (index + 1) % tracksRef.current.length;
        setCurrentIndex(next);
        setTimeout(() => loadTrackByIndex(next, true), 100);
      }
    };

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
  }, []);

  // Sync volume to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  // Subtext rotation
  useEffect(() => {
    const id = setInterval(() => setCurrentSubtext(p => (p + 1) % subtexts.length), 3200);
    return () => clearInterval(id);
  }, []);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = tracksRef.current[currentIndex];
    if (!track?.previewUrl) return;

    if (!audio.src || !audio.src.startsWith('http')) {
      loadTrackByIndex(currentIndex, true);
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentIndex, loadTrackByIndex]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    // If >3s in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const prev = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prev);
    loadTrackByIndex(prev, isPlaying);
  }, [currentIndex, tracks.length, isPlaying, loadTrackByIndex]);

  const handleNext = useCallback(() => {
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    loadTrackByIndex(next, isPlaying);
  }, [currentIndex, tracks.length, isPlaying, loadTrackByIndex]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const handleQueueClick = useCallback((index: number) => {
    setCurrentIndex(index);
    loadTrackByIndex(index, true);
    setShowQueue(false);
  }, [loadTrackByIndex]);

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const track    = tracks[currentIndex];
  const hasPreview = !!track?.previewUrl;

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-16 pb-16 overflow-hidden">
      {/* Aurora */}
      <div className="aurora-blob w-[600px] h-[600px] bg-primary/20 -top-[15%] -left-[15%] rounded-full" style={{ willChange: 'transform' }} />
      <div className="aurora-blob w-[450px] h-[450px] bg-accent/12 top-[35%] -right-[12%] rounded-full" style={{ animationDelay: '-8s', animationDuration: '26s', willChange: 'transform' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">

          {/* ── Left: Copy ────────────────────────────────────────────── */}
          <div className="flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">#1 Premium Discord Music Experience</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
              className="text-5xl sm:text-6xl md:text-7xl xl:text-[5rem] font-display font-extrabold leading-[1.05] text-white mb-4"
              style={{ textShadow: '0 0 60px rgba(124,58,237,0.2)' }}
            >
              Experience Music{' '}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                Without Limits.
              </span>
            </motion.h1>

            <div className="h-8 mb-5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentSubtext}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg md:text-xl text-accent/80 font-medium"
                >
                  {subtexts[currentSubtext]}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="text-base text-white/55 mb-8 max-w-lg leading-relaxed"
            >
              Deliver an unmatched listening experience to your Discord community — high-quality audio, smart queues, advanced filters, lyrics, autoplay, and more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-7 h-12 text-base shadow-[0_0_22px_theme(colors.primary.DEFAULT/0.45)] hover:shadow-[0_0_32px_theme(colors.primary.DEFAULT/0.65)] transition-all"
                onClick={() => window.open(INVITE_URL, '_blank')}
              >
                Invite Bot
              </Button>
              <Button
                size="lg" variant="outline"
                className="border-white/10 hover:bg-white/5 px-7 h-12 text-base bg-surface/40 gap-2"
                onClick={() => window.open(SUPPORT_URL, '_blank')}
              >
                <SiDiscord className="w-4 h-4" />
                Support Server
              </Button>
              <Link href="/features">
                <Button size="lg" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 px-7 h-12 text-base">
                  Explore Features
                </Button>
              </Link>
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.5 }}
              className="flex items-center gap-6 mt-9 pt-7 border-t border-white/5"
            >
              {[['60+', 'Servers'], ['80K+', 'Users'], ['99.9%', 'Uptime']].map(([val, label]) => (
                <div key={label}>
                  <p className="font-display font-bold text-lg text-white">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Music Player ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 90, damping: 20 }}
            className="relative w-full max-w-md mx-auto"
            style={{ willChange: 'transform' }}
          >
            {/* Floating mascot */}
            <div className="absolute -top-14 -right-4 z-20 hidden md:block">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                style={{ willChange: 'transform' }}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/35 shadow-[0_0_24px_theme(colors.primary.DEFAULT/0.35)]">
                  <img src={mascotImg} alt="LOFIRIYA Mascot" className="w-full h-full object-cover" />
                </div>
              </motion.div>
            </div>

            {/* Glow halo */}
            <div className="absolute inset-0 rounded-3xl blur-3xl scale-105 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${track?.color ?? '#7C3AED'}22 0%, transparent 70%)` }} />

            {/* Player card */}
            <div className="relative bg-surface/65 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Album art header strip */}
              <div
                className={`h-1.5 w-full transition-all duration-700 bg-gradient-to-r ${track?.gradient ?? 'from-primary to-accent'}`}
                style={{ opacity: 0.8 }}
              />

              <div className="relative z-10 p-5 sm:p-6">

                {/* Header row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">LOFIRIYA Demo</span>
                  </div>
                  <EqBars playing={isPlaying} />
                </div>

                {/* Album art + info */}
                <div className="flex items-center gap-4 mb-5">
                  {/* Album art */}
                  <div className="relative flex-shrink-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.82, rotate: 6 }}
                        transition={{ duration: 0.28 }}
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${track?.gradient} flex items-center justify-center shadow-lg`}
                        style={{ willChange: 'transform, opacity', boxShadow: `0 0 20px ${track?.color ?? '#7C3AED'}50` }}
                      >
                        <motion.div
                          animate={{ rotate: isPlaying ? 360 : 0 }}
                          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                          className="w-9 h-9 rounded-full bg-black/30 border border-white/20 flex items-center justify-center"
                          style={{ willChange: 'transform' }}
                        >
                          <Music2 className="w-4 h-4 text-white/80" />
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>

                    {isLoading && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50">
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      </div>
                    )}

                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_8px_theme(colors.primary.DEFAULT/0.6)]">
                      HD
                    </div>
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.22 }}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <h3 className="font-display font-bold text-white text-base leading-tight truncate">{track?.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{track?.artist}</p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        className={`transition-all duration-200 ${liked ? 'text-rose-400 scale-110' : 'text-muted-foreground hover:text-rose-400'}`}
                        onClick={() => setLiked(l => !l)}
                      >
                        <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-white transition-colors"
                        onClick={() => setShowQueue(v => !v)}
                      >
                        {showQueue ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {!hasPreview && !isLoading && (
                        <span className="text-[10px] text-amber-500/70 ml-auto">Loading preview…</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div
                    className="w-full h-1.5 bg-white/8 rounded-full overflow-visible cursor-pointer group mb-1.5 relative"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full rounded-full relative transition-none"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${track?.color ?? '#7C3AED'}, #06B6D4)`,
                        willChange: 'width',
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-white/25 text-[10px]">{currentIndex + 1}/{tracks.length} in queue</span>
                    <span>{formatTime(duration || 30)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-1 mb-4">
                  {/* Volume */}
                  <div className="flex items-center gap-2 w-24">
                    <button className="text-muted-foreground hover:text-white transition-colors flex-shrink-0" onClick={() => setIsMuted(m => !m)}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                      onChange={e => { setVolume(+e.target.value); setIsMuted(false); }}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: track?.color ?? '#7C3AED' }}
                    />
                  </div>

                  {/* Playback */}
                  <div className="flex items-center gap-3">
                    <button className="text-white/55 hover:text-white transition-colors p-1 hover:scale-110 transform" onClick={handlePrev}>
                      <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_18px_rgba(255,255,255,0.2)] disabled:opacity-50"
                      onClick={handlePlayPause}
                      disabled={isLoading || (!hasPreview && !isLoading)}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <button className="text-white/55 hover:text-white transition-colors p-1 hover:scale-110 transform" onClick={handleNext}>
                      <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                  </div>

                  <div className="w-24 flex justify-end">
                    <span className="text-xs text-muted-foreground font-mono">{currentIndex + 1}/{tracks.length}</span>
                  </div>
                </div>

                {/* Queue panel */}
                <AnimatePresence>
                  {showQueue && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/8 pt-3">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Queue</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {tracks.map((t, i) => (
                            <button
                              key={i}
                              onClick={() => handleQueueClick(i)}
                              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all text-left group ${
                                i === currentIndex
                                  ? 'bg-white/10'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                                style={{ background: `${t.color}33`, color: t.color }}
                              >
                                {i === currentIndex && isPlaying ? '▶' : i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${i === currentIndex ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                                  {t.title}
                                </p>
                                <p className="text-[10px] text-white/30 truncate">{t.artist}</p>
                              </div>
                              {!t.previewUrl && (
                                <span className="text-[9px] text-amber-500/50 flex-shrink-0">Loading</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* waveBar keyframes */}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}

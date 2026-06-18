import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Menu, X, ExternalLink, ChevronRight, Zap, Terminal, Star,
  Activity, LifeBuoy, LayoutDashboard, Music2, Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import mascotImg from "@assets/20260615_035917_1781590040213.jpg";

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';
const SUPPORT_URL = 'https://discord.gg/5gcFVbnxxF';

const NAV_LINKS = [
  { name: 'Home',      path: '/' },
  { name: 'Features',  path: '/features' },
  { name: 'Commands',  path: '/commands' },
  { name: 'Premium',   path: '/premium' },
  { name: 'Status',    path: '/status' },
  { name: 'Support',   path: '/support' },
  { name: 'Dashboard', path: '/dashboard' },
];

const MOBILE_LINKS = [
  { name: 'Home',      path: '/',          icon: Home },
  { name: 'Features',  path: '/features',  icon: Zap },
  { name: 'Commands',  path: '/commands',  icon: Terminal },
  { name: 'Premium',   path: '/premium',   icon: Star },
  { name: 'Status',    path: '/status',    icon: Activity },
  { name: 'Support',   path: '/support',   icon: LifeBuoy },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [location]                       = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const isActive = (path: string) =>
    path === '/' ? location === '/' : location.startsWith(path);

  return (
    <>
      {/* ── Top bar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled ? 'bg-[#050816]/80 backdrop-blur-2xl' : 'bg-transparent'
        }`}
      >
        {/* Thin top accent line */}
        {scrolled && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        )}

        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 max-w-[1400px]">
          {/* Three-column grid: logo | pill | cta */}
          <div className="h-full grid grid-cols-[auto_1fr_auto] items-center gap-4">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-primary/35
                shadow-[0_0_12px_theme(colors.primary.DEFAULT/0.28)]
                group-hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT/0.55)] transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/12 pointer-events-none" />
                <img src={mascotImg} alt="LOFIRIYA" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-extrabold text-[1.05rem] tracking-tight text-white group-hover:text-glow transition-all duration-300 whitespace-nowrap">
                  LOFIRIYA
                </span>
                <span className="hidden sm:block text-[0.48rem] font-bold text-primary/55 uppercase tracking-[0.22em] mt-0.5">
                  Discord Music Bot
                </span>
              </div>
            </Link>

            {/* ── Centered pill nav (desktop only) ── */}
            <div className="hidden md:flex justify-center">
              <div
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-full border border-white/10
                  bg-white/[0.04] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      href={link.path}
                      className={`relative px-3.5 py-1.5 text-[0.82rem] font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                        active
                          ? 'text-white'
                          : 'text-white/50 hover:text-white/90'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="navPill"
                          className="absolute inset-0 rounded-full bg-primary/20 border border-primary/30"
                          style={{ boxShadow: '0 0 10px rgba(139,92,246,0.35)' }}
                          transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Right: CTA ── */}
            <div className="flex items-center gap-2 justify-end">
              {/* Desktop / tablet invite */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.open(INVITE_URL, '_blank')}
                className="hidden md:flex items-center gap-1.5 px-5 py-2 rounded-full text-[0.82rem] font-bold text-white
                  bg-primary hover:bg-primary/90
                  shadow-[0_0_18px_theme(colors.primary.DEFAULT/0.45)] hover:shadow-[0_0_28px_theme(colors.primary.DEFAULT/0.7)]
                  transition-all duration-200 whitespace-nowrap"
              >
                Invite Bot
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.button>

              {/* Mobile invite */}
              <Button
                size="sm"
                className="flex md:hidden bg-primary hover:bg-primary/90 text-white px-3.5 h-9 text-sm rounded-full
                  shadow-[0_0_14px_theme(colors.primary.DEFAULT/0.4)] transition-all"
                onClick={() => window.open(INVITE_URL, '_blank')}
              >
                Invite Bot
              </Button>

              {/* Hamburger — mobile only */}
              <button
                className="flex md:hidden w-9 h-9 items-center justify-center rounded-xl text-white hover:bg-white/8 transition-colors"
                onClick={() => setMobileOpen(v => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileOpen ? 'x' : 'menu'}
                    initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.14 }}
                  >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
              className="fixed top-16 left-0 right-0 z-40 lg:hidden
                bg-[#080d1f]/98 backdrop-blur-2xl border-b border-white/8
                shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
            >
              <div className="px-4 py-3 space-y-0.5">
                {MOBILE_LINKS.map((link, i) => {
                  const active = isActive(link.path);
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        href={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all group ${
                          active
                            ? 'bg-primary/10 text-white border border-primary/20'
                            : 'text-white/65 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-primary' : 'text-white/28 group-hover:text-primary/65'}`} />
                          <span className="font-medium text-[0.88rem]">{link.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${active ? 'text-primary/50' : 'text-white/18'}`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-white/6 flex gap-2">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-10 font-medium shadow-[0_0_14px_theme(colors.primary.DEFAULT/0.35)] gap-2 text-sm rounded-xl"
                  onClick={() => { window.open(INVITE_URL, '_blank'); setMobileOpen(false); }}
                >
                  <Music2 className="w-4 h-4" /> Invite Bot
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white/65 hover:bg-white/5 h-10 font-medium text-sm rounded-xl"
                  onClick={() => { window.open(SUPPORT_URL, '_blank'); setMobileOpen(false); }}
                >
                  Support
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

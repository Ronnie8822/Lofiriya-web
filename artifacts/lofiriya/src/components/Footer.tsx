import { Link } from 'wouter';
import { Music2, ExternalLink } from 'lucide-react';
import { SiDiscord, SiX, SiGithub, SiInstagram } from 'react-icons/si';

const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';
const DISCORD_LINK = 'https://discord.gg/5gcFVbnxxF';
const TWITTER_LINK = 'https://x.com/rommu_uwu';
const GITHUB_LINK = 'https://github.com/rommuwu';
const INSTAGRAM_LINK = 'https://www.instagram.com/rommu_uwu';

const socials = [
  { href: DISCORD_LINK, Icon: SiDiscord, label: 'Discord', color: 'hover:text-[#5865F2] hover:bg-[#5865F2]/15' },
  { href: TWITTER_LINK, Icon: SiX, label: 'X / Twitter', color: 'hover:text-white hover:bg-white/10' },
  { href: GITHUB_LINK, Icon: SiGithub, label: 'GitHub', color: 'hover:text-white hover:bg-white/10' },
  { href: INSTAGRAM_LINK, Icon: SiInstagram, label: 'Instagram', color: 'hover:text-[#E1306C] hover:bg-[#E1306C]/15' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 pt-14 pb-8 relative overflow-hidden bg-surface/20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-colors">
                <Music2 className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-xl text-white group-hover:text-glow transition-all">
                LOFIRIYA
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-xs">
              The next-generation Discord Music Bot. Premium audio, smart queues, and an experience built for communities that care about sound.
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  data-testid={`footer-social-${s.label.toLowerCase().split('/')[0].trim()}`}
                  className={`w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-muted-foreground ${s.color} border-transparent transition-all duration-200`}
                >
                  <s.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm mb-4 uppercase tracking-wide">Product</h3>
            <ul className="space-y-2.5">
              <li><Link href="/features" className="text-muted-foreground hover:text-primary transition-colors text-sm" data-testid="footer-features">Features</Link></li>
              <li><Link href="/commands" className="text-muted-foreground hover:text-primary transition-colors text-sm" data-testid="footer-commands">Commands</Link></li>
              <li><Link href="/premium" className="text-muted-foreground hover:text-primary transition-colors text-sm" data-testid="footer-premium">Premium</Link></li>
              <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm" data-testid="footer-dashboard">Dashboard</Link></li>
              <li>
                <a
                  href={INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1"
                  data-testid="footer-invite"
                >
                  Invite Bot <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm mb-4 uppercase tracking-wide">Resources</h3>
            <ul className="space-y-2.5">
              <li><Link href="/status" className="text-muted-foreground hover:text-primary transition-colors text-sm" data-testid="footer-status">Status</Link></li>
              <li><Link href="/support" className="text-muted-foreground hover:text-primary transition-colors text-sm" data-testid="footer-support">Support</Link></li>
              <li>
                <a
                  href={DISCORD_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-[#5865F2] transition-colors text-sm flex items-center gap-1"
                  data-testid="footer-discord"
                >
                  Discord Server <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href={GITHUB_LINK} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors text-sm" data-testid="footer-github">
                  GitHub
                </a>
              </li>
              <li>
                <a href={TWITTER_LINK} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors text-sm" data-testid="footer-twitter">
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm mb-4 uppercase tracking-wide">Legal</h3>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm" data-testid="footer-tos">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-white transition-colors text-sm" data-testid="footer-privacy">Privacy Policy</a></li>
            </ul>

            <div className="mt-6 p-3 rounded-xl bg-primary/8 border border-primary/15">
              <p className="text-xs text-primary/80 font-medium mb-1">Bot Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm order-2 sm:order-1">
            © {year} LOFIRIYA. All Rights Reserved.
          </p>
          <p className="text-muted-foreground/50 text-xs order-1 sm:order-2">
            Made with love for the Discord community
          </p>
        </div>
      </div>
    </footer>
  );
}

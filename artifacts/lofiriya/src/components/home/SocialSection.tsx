import { motion } from 'framer-motion';
import { SiDiscord, SiX, SiGithub, SiInstagram } from 'react-icons/si';
import { CheckCircle2 } from 'lucide-react';

const DISCORD_LINK = 'https://discord.gg/5gcFVbnxxF';
const TWITTER_LINK = 'https://x.com/rommu_uwu';
const GITHUB_LINK = 'https://github.com/rommuwu';
const INSTAGRAM_LINK = 'https://www.instagram.com/rommu_uwu';

const socials = [
  {
    id: 'discord',
    name: 'Discord',
    handle: 'discord.gg/lofiriya',
    href: DISCORD_LINK,
    Icon: SiDiscord,
    color: '#5865F2',
    glow: 'rgba(88,101,242,0.35)',
    bg: 'from-[#5865F2]/15 to-[#4752C4]/10',
    border: 'border-[#5865F2]/20',
    desc: 'Join our community server',
    badge: 'verified',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    handle: '@rommu_uwu',
    href: TWITTER_LINK,
    Icon: SiX,
    color: '#E7E9EA',
    glow: 'rgba(231,233,234,0.20)',
    bg: 'from-white/8 to-white/4',
    border: 'border-white/10',
    desc: 'Follow for updates',
    badge: null,
  },
  {
    id: 'github',
    name: 'GitHub',
    handle: 'github.com/rommuwu',
    href: GITHUB_LINK,
    Icon: SiGithub,
    color: '#f0f6fc',
    glow: 'rgba(240,246,252,0.20)',
    bg: 'from-white/8 to-white/4',
    border: 'border-white/10',
    desc: 'Star us on GitHub',
    badge: null,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@rommu_uwu',
    href: INSTAGRAM_LINK,
    Icon: SiInstagram,
    color: '#E1306C',
    glow: 'rgba(225,48,108,0.30)',
    bg: 'from-[#E1306C]/12 to-[#833AB4]/8',
    border: 'border-[#E1306C]/18',
    desc: 'Behind the scenes',
    badge: null,
  },
];

export function SocialSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-surface/20">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Stay Connected</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Follow LOFIRIYA
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Get the latest updates, join our community, and be part of the LOFIRIYA family.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {socials.map((social, i) => (
            <motion.a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-br ${social.bg} border ${social.border} backdrop-blur-sm overflow-hidden group cursor-pointer transition-all duration-300`}
              style={{ willChange: 'transform' }}
              data-testid={`social-${social.id}`}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px 0 ${social.glow}`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {/* Ambient glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${social.glow}, transparent 70%)` }}
              />

              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${social.color}18` }}
              >
                <social.Icon className="w-7 h-7 transition-all duration-300" style={{ color: social.color }} />
              </div>

              <div className="text-center relative z-10">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <p className="font-display font-bold text-white text-base">{social.name}</p>
                  {social.badge === 'verified' && (
                    <CheckCircle2 className="w-4 h-4 text-[#5865F2] flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{social.handle}</p>
                <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{social.desc}</p>
              </div>

              {/* Arrow indicator on hover */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

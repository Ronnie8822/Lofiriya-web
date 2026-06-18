import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SiDiscord } from 'react-icons/si';
import {
  Crown, Check, X, ChevronDown, Star, Zap, Sparkles,
  ExternalLink, Shield, Rocket, Music, Headphones,
} from 'lucide-react';

const DISCORD_LINK = 'https://discord.gg/5gcFVbnxxF';
const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const PRICING = {
  INR: {
    symbol: '₹',
    Basic:   { monthly: '219',   yearly: '2,365' },
    Pro:     { monthly: '319',   yearly: '3,445' },
    ProPlus: { monthly: '399',   yearly: '4,213' },
  },
  USD: {
    symbol: '$',
    Basic:   { monthly: '2.99',  yearly: '32.29' },
    Pro:     { monthly: '3.99',  yearly: '43.09' },
    ProPlus: { monthly: '4.99',  yearly: '52.69' },
  },
};

type Currency = 'INR' | 'USD';
type Billing  = 'monthly' | 'yearly';

// ─── Plan Definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    key: 'Basic' as const,
    name: 'Basic',
    badge: 'Starter',
    badgeColor: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
    icon: Headphones,
    iconBg: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    glow: 'rgba(6,182,212,0.15)',
    accentColor: '#06B6D4',
    borderClass: 'border-cyan-500/20 hover:border-cyan-500/45',
    buttonClass: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/35 hover:border-cyan-400/60',
    features: [
      'Queue up to 1000 songs',
      'High Quality Audio',
      'Volume up to 200%',
      'Audio Filters & Effects',
      '24/7 Mode (/247)',
      'Lyrics for Any Song',
      'No-Prefix Access',
      'Premium Support',
    ],
  },
  {
    key: 'Pro' as const,
    name: 'Pro',
    badge: 'Most Popular',
    badgeColor: 'bg-primary/20 border-primary/40 text-purple-300',
    icon: Zap,
    iconBg: 'from-purple-500/25 to-indigo-500/25 border-purple-500/35',
    glow: 'rgba(139,92,246,0.22)',
    accentColor: '#8B5CF6',
    borderClass: 'border-primary/35 hover:border-primary/65',
    popular: true,
    buttonClass: 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_18px_rgba(139,92,246,0.45)] hover:shadow-[0_0_30px_rgba(139,92,246,0.65)]',
    features: [
      'Queue up to 1000 songs',
      'High Quality Audio',
      'Volume up to 200%',
      'Audio Filters & Effects',
      '24/7 Mode (/247)',
      'Lyrics for Any Song',
      'Synced Lyrics',
      'Advanced DJ Controls',
      'No Restrictions',
      'No-Prefix Access',
      'Custom Bot Name & Avatar Profile',
      'Custom Display Name Effects',
      'Premium Support in Support Server',
    ],
  },
  {
    key: 'ProPlus' as const,
    name: 'Pro Plus',
    badge: 'Best Value',
    badgeColor: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    icon: Crown,
    iconBg: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    glow: 'rgba(245,158,11,0.15)',
    accentColor: '#F59E0B',
    borderClass: 'border-amber-500/22 hover:border-amber-500/50',
    buttonClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.65)]',
    features: [
      'Everything in Pro Plan',
      'Lofi Riya Premium Bot',
      'Beta Features Access',
      '24/7 Priority Support',
    ],
  },
];

// ─── Comparison Table Data ────────────────────────────────────────────────────

const TABLE_FEATURES: { label: string; free: boolean; basic: boolean; pro: boolean; proPlus: boolean }[] = [
  { label: 'Access to Premium Features',   free: false, basic: true,  pro: true,  proPlus: true  },
  { label: 'Queue up to 1000 Songs',       free: false, basic: true,  pro: true,  proPlus: true  },
  { label: 'High Quality Audio',           free: true, basic: true,  pro: true,  proPlus: true  },
  { label: 'Volume up to 200%',            free: false, basic: true,  pro: true,  proPlus: true  },
  { label: 'Audio Filters & Effects',      free: false,  basic: true,  pro: true,  proPlus: true  },
  { label: 'Priority Queue',               free: true, basic: true, pro: true,  proPlus: true  },
  { label: '24/7 Mode',                    free: false, basic: true,  pro: true,  proPlus: true  },
  { label: 'Lyrics',                       free: false,  basic: true,  pro: true,  proPlus: true  },
  { label: 'Synced Lyrics',                free: false, basic: false, pro: true,  proPlus: true  },
  { label: 'Advanced DJ Controls',         free: false, basic: false, pro: true,  proPlus: true  },
  { label: 'No Restrictions',              free: false, basic: false, pro: true,  proPlus: true  },
  { label: 'Custom Bot Name & Avatar',     free: false, basic: false, pro: true,  proPlus: true  },
  { label: 'Custom Display Name Effects',  free: false, basic: false, pro: true,  proPlus: true  },
  { label: 'No Prefix Access',             free: false, basic: true,  pro: true,  proPlus: true  },
  { label: 'Premium Support',              free: false, basic: true,  pro: true,  proPlus: true  },
  { label: 'Priority Support',             free: false, basic: false, pro: false, proPlus: true  },
  { label: 'Lofi Riya Premium Bot',        free: false, basic: false, pro: false, proPlus: true  },
  { label: 'Beta Features Access',         free: false, basic: false, pro: false, proPlus: true  },
];

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'How do I activate Premium?', a: 'Premium is activated after verification inside the support server. Join our Discord and open a ticket — our staff will activate your plan quickly.' },
  { q: 'How long does activation take?', a: 'Usually within a few minutes after payment confirmation. Our staff is active daily.' },
  { q: 'Can I upgrade my plan later?', a: 'Yes, you can upgrade at any time. Contact our support team in Discord and they will assist with the upgrade process.' },
  { q: 'Do yearly plans save money?', a: 'Yes! Yearly plans offer discounted pricing versus paying monthly. Basic saves 10%, Pro saves 10%, and Pro Plus saves 12%.' },
  { q: 'What payment methods are supported?', a: 'We support UPI, PayPal, Debit/Credit Cards, and other supported payment gateways. Contact us in Discord for payment options.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ value, options, onChange }: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/8">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            value === opt.value
              ? 'bg-white/10 text-white shadow-inner'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckIcon({ ok, accent }: { ok: boolean; accent?: string }) {
  if (ok) return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: accent ? `${accent}22` : 'rgba(139,92,246,0.18)' }}>
      <Check className="w-3 h-3" style={{ color: accent ?? '#8B5CF6' }} strokeWidth={2.5} />
    </div>
  );
  return <X className="w-4 h-4 text-white/15 flex-shrink-0" />;
}

function TableCheck({ ok, col }: { ok: boolean; col: 'free' | 'basic' | 'pro' | 'proPlus' }) {
  const colors = { free: '#6b7280', basic: '#06B6D4', pro: '#8B5CF6', proPlus: '#F59E0B' };
  if (ok) return (
    <div className="flex justify-center">
      <div className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: `${colors[col]}22` }}>
        <Check className="w-3.5 h-3.5" style={{ color: colors[col] }} strokeWidth={2.5} />
      </div>
    </div>
  );
  return <div className="flex justify-center"><X className="w-4 h-4 text-white/15" /></div>;
}

function FAQItem({ faq, idx }: { faq: typeof FAQS[0]; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
      className={`rounded-2xl border transition-all duration-250 overflow-hidden ${
        open ? 'border-primary/30 bg-primary/[0.04]' : 'border-white/7 bg-white/[0.015] hover:border-white/14'
      }`}
    >
      <button onClick={() => setOpen(v => !v)} className="w-full flex justify-between items-center px-5 py-4 text-left gap-4">
        <span className="font-medium text-white/90 text-sm">{faq.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="flex-shrink-0">
          <ChevronDown className={`w-4 h-4 ${open ? 'text-primary' : 'text-white/30'}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">{faq.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Purchase Modal ────────────────────────────────────────────────────────────

function PurchaseModal({ plan, onClose }: { plan: typeof PLANS[0] | null; onClose: () => void }) {
  if (!plan) return null;
  return (
    <AnimatePresence>
      {plan && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full max-w-sm rounded-3xl bg-[#080d1f] border border-white/10 p-7 text-center shadow-2xl"
              style={{ boxShadow: `0 0 60px ${plan.glow}` }}>
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.iconBg} border mx-auto flex items-center justify-center mb-5`}
                style={{ boxShadow: `0 0 22px ${plan.glow}` }}>
                <plan.icon className="w-7 h-7" style={{ color: plan.accentColor }} />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">
                Complete Your Purchase
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Purchase <span className="text-white font-semibold">Lofi Riya {plan.name}</span> through our Support Server. Our staff will verify and activate your plan within minutes.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium gap-2 shadow-[0_0_16px_rgba(88,101,242,0.4)]"
                  onClick={() => window.open(DISCORD_LINK, '_blank')}
                >
                  <SiDiscord className="w-4 h-4" />
                  Join Support Server
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 border-white/10 hover:bg-white/5 text-white/70 bg-transparent"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-white/30 mt-4">You will be directed to our official Discord server.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Premium() {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [billing, setBilling]   = useState<Billing>('monthly');
  const [modalPlan, setModalPlan] = useState<typeof PLANS[0] | null>(null);

  const pr = PRICING[currency];

  function getPrice(key: 'Basic' | 'Pro' | 'ProPlus') {
    return billing === 'monthly' ? pr[key].monthly : pr[key].yearly;
  }

  function getPeriod() {
    return billing === 'monthly' ? '/mo' : '/yr';
  }

  function getSavingsBadge(key: 'Basic' | 'Pro' | 'ProPlus') {
    if (billing !== 'yearly') return null;
    const pct = key === 'ProPlus' ? '12%' : '10%';
    return (
      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
        Save {pct}
      </span>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">

      {/* ── Dotted pattern background ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ── Ambient glows ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="aurora-blob w-[700px] h-[700px] bg-primary/12 -top-[15%] -left-[10%] rounded-full" />
        <div className="aurora-blob w-[500px] h-[500px] bg-amber-500/8 top-[40%] -right-[8%] rounded-full" style={{ animationDelay: '-8s', animationDuration: '26s' }} />
        <div className="aurora-blob w-[400px] h-[400px] bg-cyan-500/8 bottom-[5%] left-[10%] rounded-full" style={{ animationDelay: '-14s', animationDuration: '22s' }} />
      </div>

      <div className="relative z-10">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="pt-32 pb-12 text-center px-4">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            {/* Crown badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 mb-6">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Lofi Riya Premium</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white leading-tight mb-5">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-amber-400">
                Premium Experience
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Unlock advanced music features, premium controls, exclusive perks and priority support for Lofi Riya.
            </p>

            {/* Toggles */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Toggle
                value={currency}
                options={[{ label: 'INR ₹', value: 'INR' }, { label: 'USD $', value: 'USD' }]}
                onChange={v => setCurrency(v as Currency)}
              />
              <Toggle
                value={billing}
                options={[{ label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' }]}
                onChange={v => setBilling(v as Billing)}
              />
              {billing === 'yearly' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/12 border border-emerald-500/25"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Save up to 20% with yearly</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ══ PLAN CARDS ════════════════════════════════════════════════════ */}
        <section className="pb-16 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan, i) => {
              const priceKey = plan.key as 'Basic' | 'Pro' | 'ProPlus';
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -5, transition: { duration: 0.22 } }}
                  className={`relative flex flex-col rounded-3xl border ${plan.borderClass} transition-all duration-300 overflow-hidden ${
                    plan.popular ? 'md:scale-[1.03] md:z-10' : ''
                  }`}
                  style={{
                    background: 'rgba(8,13,31,0.75)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: plan.popular ? `0 0 40px ${plan.glow}` : undefined,
                  }}
                >
                  {/* Popular ribbon */}
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}

                  <div className="p-7 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.iconBg} border flex items-center justify-center`}
                        style={{ boxShadow: `0 0 16px ${plan.glow}` }}>
                        <plan.icon className="w-5 h-5" style={{ color: plan.accentColor }} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-white text-xl mb-1">{plan.name}</h3>

                    {/* Price */}
                    <div className="flex items-end gap-1 mb-1 mt-2">
                      <span className="text-4xl font-extrabold font-display text-white leading-none">
                        {pr.symbol}{getPrice(priceKey)}
                      </span>
                      <span className="text-muted-foreground text-sm mb-0.5">{getPeriod()}</span>
                    </div>
                    <div className="flex items-center h-5 mb-6">
                      {getSavingsBadge(priceKey)}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => setModalPlan(plan)}
                      className={`w-full h-11 rounded-xl text-sm font-bold transition-all duration-200 mb-7 ${plan.buttonClass}`}
                    >
                      Purchase {plan.name}
                    </button>

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-start gap-2.5">
                          <CheckIcon ok accent={plan.accentColor} />
                          <span className="text-sm text-white/80 leading-snug">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Savings note */}
          <p className="text-center text-xs text-white/30 mt-6">
            All prices include applicable taxes · No hidden fees · Cancel anytime
          </p>
        </section>

        {/* ══ COMPARISON TABLE ══════════════════════════════════════════════ */}
        <section className="py-16 px-4 bg-white/[0.012] border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Compare</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Feature Comparison</h2>
              <p className="text-muted-foreground text-sm">See exactly what you get with each plan.</p>
            </motion.div>

            <div className="overflow-x-auto rounded-2xl border border-white/7 bg-[#080d1f]/70 backdrop-blur-xl">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-white/7">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-white/50 w-[40%]">Feature</th>
                    {[
                      { label: 'Free',     color: '#6b7280' },
                      { label: 'Basic',    color: '#06B6D4' },
                      { label: 'Pro',      color: '#8B5CF6' },
                      { label: 'Pro Plus', color: '#F59E0B' },
                    ].map(col => (
                      <th key={col.label} className="px-3 py-4 text-center text-sm font-bold w-[15%]" style={{ color: col.color }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABLE_FEATURES.map((row, i) => (
                    <motion.tr
                      key={row.label}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? '' : 'bg-white/[0.012]'}`}
                    >
                      <td className="px-5 py-3.5 text-sm text-white/70">{row.label}</td>
                      <td className="px-3 py-3.5"><TableCheck ok={row.free}    col="free" /></td>
                      <td className="px-3 py-3.5"><TableCheck ok={row.basic}   col="basic" /></td>
                      <td className="px-3 py-3.5"><TableCheck ok={row.pro}     col="pro" /></td>
                      <td className="px-3 py-3.5"><TableCheck ok={row.proPlus} col="proPlus" /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">How It Works</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Get Premium in 3 Steps</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { step: '01', icon: SiDiscord, title: 'Join Discord', desc: 'Join our support server and open a Premium ticket.', color: '#5865F2' },
                { step: '02', icon: Shield, title: 'Complete Payment', desc: 'Choose your plan and complete payment via UPI, PayPal or card.', color: '#8B5CF6' },
                { step: '03', icon: Crown, title: 'Get Activated', desc: 'Staff verifies and activates your Premium within minutes.', color: '#F59E0B' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl border border-white/7 bg-white/[0.02]"
                >
                  <div className="relative inline-block mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                      style={{ background: `${item.color}22`, border: `1px solid ${item.color}44`, boxShadow: `0 0 16px ${item.color}30` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-extrabold flex items-center justify-center"
                      style={{ background: item.color, color: '#000' }}>{item.step}</span>
                  </div>
                  <h3 className="font-display font-bold text-white text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
        <section className="py-6 pb-14 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Common Questions</h2>
            </motion.div>
            <div className="space-y-2.5">
              {FAQS.map((faq, i) => <FAQItem key={faq.q} faq={faq} idx={i} />)}
            </div>
          </div>
        </section>

        {/* ══ CTA BANNER ════════════════════════════════════════════════════ */}
        <section className="py-8 pb-20 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-primary/25 p-8 md:p-12 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(8,13,31,0.9) 50%, rgba(245,158,11,0.06) 100%)' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-primary/18 blur-3xl pointer-events-none" />
              <Crown className="relative w-10 h-10 text-amber-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.5))' }} />
              <h2 className="relative text-2xl md:text-3xl font-display font-bold text-white mb-3">Ready to Go Premium?</h2>
              <p className="relative text-muted-foreground text-sm max-w-md mx-auto mb-7 leading-relaxed">
                Join thousands of servers already using Lofi Riya Premium for the best music experience on Discord.
              </p>
              <div className="relative flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 h-11 font-medium shadow-[0_0_18px_rgba(88,101,242,0.4)] hover:shadow-[0_0_28px_rgba(88,101,242,0.6)] transition-all gap-2 text-sm"
                  onClick={() => window.open(DISCORD_LINK, '_blank')}
                >
                  <SiDiscord className="w-4 h-4" /> Get Premium
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/12 hover:bg-white/5 px-8 h-11 font-medium gap-2 bg-white/[0.03] text-sm"
                  onClick={() => window.open(INVITE_URL, '_blank')}
                >
                  Invite Bot <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="relative flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/6">
                <p className="text-xs text-white/30 w-full">Lofi Riya Premium © {new Date().getFullYear()} · All prices include applicable taxes · No hidden fees</p>
              </div>
            </motion.div>
          </div>
        </section>

      </div>

      {/* ── Purchase Modal ── */}
      {modalPlan && <PurchaseModal plan={modalPlan} onClose={() => setModalPlan(null)} />}
    </div>
  );
}


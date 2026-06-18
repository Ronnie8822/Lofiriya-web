import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  SiDiscord,
} from 'react-icons/si';
import {
  Bug, Rocket, MessageCircle, ChevronDown, ChevronRight,
  ExternalLink, Loader2, CheckCircle2, AlertCircle,
  HelpCircle, Crown, Headphones, Zap,
} from 'lucide-react';

const DISCORD_LINK = 'https://discord.gg/5gcFVbnxxF';
const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot';
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = 'idle' | 'loading' | 'success' | 'error';
type ActiveForm = 'bug' | 'feature';

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls = `w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-primary/50 
  text-white placeholder:text-muted-foreground/50 outline-none focus:shadow-[0_0_0_3px_theme(colors.primary.DEFAULT/0.12)] 
  transition-all text-sm font-sans`;

const labelCls = 'block text-sm font-medium text-white/80 mb-1.5';

// ─── Simple validation ────────────────────────────────────────────────────────

function required(val: string, min = 2) {
  return val.trim().length >= min;
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How do I activate Premium?',
    a: 'After purchasing a Premium plan, use the /premium command in your server. Your plan activates automatically once payment is confirmed.',
  },
  {
    q: 'How long does Premium activation take?',
    a: 'Premium is activated instantly after a successful payment. If it has not activated within 5 minutes, join our support server for assistance.',
  },
  {
    q: 'How do I use No Prefix mode?',
    a: 'No Prefix mode is a Premium feature. Once Premium is active, enable it with /setprefix none — you can then use commands without any prefix.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Use the Bug Report form on this page. Fill in all required fields and describe the issue as clearly as possible. You can also report directly in our Discord server.',
  },
  {
    q: 'Where can I get support?',
    a: 'Join our official Discord support server using the link on this page. Our staff and community are active daily and respond quickly.',
  },
  {
    q: 'How do I upgrade my plan?',
    a: 'Use the /premium command to view available plans and upgrade options. You can also visit the Premium page on this website.',
  },
];

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        open ? 'border-primary/30 bg-primary/5' : 'border-white/8 bg-white/[0.02] hover:border-white/14'
      }`}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-white text-sm">{faq.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className={`w-4 h-4 transition-colors ${open ? 'text-primary' : 'text-white/30'}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0, 1] }}
          >
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Bug Report Form ──────────────────────────────────────────────────────────
// NOTE: All inputs are inlined directly — do NOT extract them into a sub-component
// defined inside this function. React would treat each render as a new component type,
// unmounting and remounting inputs on every keystroke (causing focus/keyboard loss on mobile).

function BugReportForm() {
  const { toast } = useToast();
  const [state, setState] = useState<FormState>('idle');

  // Individual state per field — avoids full re-render cascade from a single object
  const [username,    setUsername]    = useState('');
  const [userid,      setUserId]      = useState('');
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('Music Issue');
  const [description, setDescription] = useState('');
  const [steps,       setSteps]       = useState('');
  const [screenshot,  setScreenshot]  = useState('');
  const [serverid,    setServerId]    = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!required(username))       e.username    = 'Required (min 2 chars)';
    if (!required(userid))         e.userid      = 'Required';
    if (!required(title, 5))       e.title       = 'Required (min 5 chars)';
    if (!required(description, 10))e.description = 'Required (min 10 chars)';
    if (!required(steps, 10))      e.steps       = 'Required (min 10 chars)';
    if (screenshot && !/^https?:\/\/.+/.test(screenshot)) e.screenshot = 'Must be a valid URL';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setState('loading');
    try {
      const res = await fetch(`${BASE_PATH}/api/support/bug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userid, title, category, description, steps, screenshot, serverid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setState('success');
      toast({ title: '✅ Bug report submitted!', description: 'Our team will look into it shortly.' });
      setUsername(''); setUserId(''); setTitle(''); setCategory('Music Issue');
      setDescription(''); setSteps(''); setScreenshot(''); setServerId('');
      setTimeout(() => setState('idle'), 4000);
    } catch (err) {
      setState('error');
      toast({ title: '❌ Submission failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Username */}
        <div>
          <label className={labelCls}>Discord Username<span className="text-primary ml-0.5">*</span></label>
          <input type="text" placeholder="username" value={username}
            onChange={e => setUsername(e.target.value)} className={inputCls} autoComplete="off" />
          {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
        </div>
        {/* User ID */}
        <div>
          <label className={labelCls}>Discord User ID<span className="text-primary ml-0.5">*</span></label>
          <input type="text" placeholder="123456789012345678" value={userid}
            onChange={e => setUserId(e.target.value)} className={inputCls} autoComplete="off" />
          {errors.userid && <p className="text-red-400 text-xs mt-1">{errors.userid}</p>}
        </div>
      </div>

      {/* Issue title */}
      <div>
        <label className={labelCls}>Issue Title<span className="text-primary ml-0.5">*</span></label>
        <input type="text" placeholder="Audio stops playing after 5 minutes" value={title}
          onChange={e => setTitle(e.target.value)} className={inputCls} autoComplete="off" />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Issue Category<span className="text-primary ml-0.5">*</span></label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className={`${inputCls} cursor-pointer`}
          style={{ WebkitAppearance: 'none', backgroundImage: 'none' }}
        >
          {['Music Issue','Premium Issue','Playback Issue','Lyrics Issue','Filter Issue','Dashboard Issue','Other'].map(c =>
            <option key={c} value={c} style={{ background: '#0a0c18' }}>{c}</option>
          )}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description<span className="text-primary ml-0.5">*</span></label>
        <textarea rows={4} placeholder="Describe what happened in detail..." value={description}
          onChange={e => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Steps */}
      <div>
        <label className={labelCls}>Steps To Reproduce<span className="text-primary ml-0.5">*</span></label>
        <textarea rows={4} placeholder={'1. Join voice channel\n2. Use /play command\n3. ...'} value={steps}
          onChange={e => setSteps(e.target.value)} className={`${inputCls} resize-none`} />
        {errors.steps && <p className="text-red-400 text-xs mt-1">{errors.steps}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Screenshot */}
        <div>
          <label className={labelCls}>Screenshot URL</label>
          <input type="text" placeholder="https://imgur.com/..." value={screenshot}
            onChange={e => setScreenshot(e.target.value)} className={inputCls} autoComplete="off" />
          {errors.screenshot && <p className="text-red-400 text-xs mt-1">{errors.screenshot}</p>}
        </div>
        {/* Server ID */}
        <div>
          <label className={labelCls}>Server ID</label>
          <input type="text" placeholder="987654321012345678" value={serverid}
            onChange={e => setServerId(e.target.value)} className={inputCls} autoComplete="off" />
        </div>
      </div>

      <Button
        type="submit"
        disabled={state === 'loading' || state === 'success'}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium shadow-[0_0_18px_theme(colors.primary.DEFAULT/0.35)] hover:shadow-[0_0_26px_theme(colors.primary.DEFAULT/0.5)] transition-all gap-2 text-sm"
      >
        {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        {state === 'error'   && <AlertCircle  className="w-4 h-4 text-red-400" />}
        {state === 'loading' ? 'Submitting…' : state === 'success' ? 'Submitted!' : 'Submit Bug Report'}
      </Button>
    </form>
  );
}

// ─── Feature Request Form ─────────────────────────────────────────────────────

function FeatureRequestForm() {
  const { toast } = useToast();
  const [state, setState] = useState<FormState>('idle');
  const [fields, setFields] = useState({ username: '', title: '', description: '', reason: '' });
  const [errors, setErrors] = useState<Partial<typeof fields>>({});

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<typeof fields> = {};
    if (!required(fields.username)) e.username = 'Required';
    if (!required(fields.title, 5)) e.title = 'Required (min 5 chars)';
    if (!required(fields.description, 10)) e.description = 'Required (min 10 chars)';
    if (!required(fields.reason, 10)) e.reason = 'Required (min 10 chars)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setState('loading');
    try {
      const res = await fetch(`${BASE_PATH}/api/support/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setState('success');
      toast({ title: '🚀 Feature request submitted!', description: 'Thanks for helping make LOFIRIYA better.' });
      setFields({ username: '', title: '', description: '', reason: '' });
      setTimeout(() => setState('idle'), 4000);
    } catch (err) {
      setState('error');
      toast({ title: '❌ Submission failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className={labelCls}>Discord Username<span className="text-primary ml-0.5">*</span></label>
        <input type="text" placeholder="username" value={fields.username} onChange={set('username')} className={inputCls} />
        {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
      </div>
      <div>
        <label className={labelCls}>Suggestion Title<span className="text-primary ml-0.5">*</span></label>
        <input type="text" placeholder="Add a crossfade feature between tracks" value={fields.title} onChange={set('title')} className={inputCls} />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
      </div>
      <div>
        <label className={labelCls}>Suggestion Description<span className="text-primary ml-0.5">*</span></label>
        <textarea rows={4} placeholder="Describe your idea in detail..." value={fields.description} onChange={set('description')} className={`${inputCls} resize-none`} />
        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
      </div>
      <div>
        <label className={labelCls}>Why Should This Be Added?<span className="text-primary ml-0.5">*</span></label>
        <textarea rows={3} placeholder="Explain why this would benefit LOFIRIYA users..." value={fields.reason} onChange={set('reason')} className={`${inputCls} resize-none`} />
        {errors.reason && <p className="text-red-400 text-xs mt-1">{errors.reason}</p>}
      </div>

      <Button
        type="submit"
        disabled={state === 'loading' || state === 'success'}
        className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium shadow-[0_0_18px_rgba(88,101,242,0.35)] hover:shadow-[0_0_26px_rgba(88,101,242,0.5)] transition-all gap-2 text-sm"
      >
        {state === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        {state === 'error'   && <AlertCircle  className="w-4 h-4 text-red-400" />}
        {state === 'loading' ? 'Submitting…' : state === 'success' ? 'Submitted!' : 'Submit Feature Request'}
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Support() {
  const [activeForm, setActiveForm] = useState<ActiveForm>('bug');

  const SUPPORT_OPTIONS = [
    {
      id: 'discord',
      title: 'Join Support Server',
      desc: 'Get direct help from staff and community members. Available daily.',
      icon: SiDiscord,
      iconColor: 'text-[#5865F2]',
      iconBg: 'bg-[#5865F2]/15 border-[#5865F2]/25',
      cardBorder: 'border-[#5865F2]/20 hover:border-[#5865F2]/50',
      glow: 'hover:shadow-[0_0_28px_rgba(88,101,242,0.2)]',
      action: () => window.open(DISCORD_LINK, '_blank'),
      label: 'Join Support Server',
      btnClass: 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
    },
    {
      id: 'bug',
      title: 'Report a Bug',
      desc: 'Found an issue? Let us know and we will fix it as fast as possible.',
      icon: Bug,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/15 border-rose-500/25',
      cardBorder: 'border-rose-500/18 hover:border-rose-500/45',
      glow: 'hover:shadow-[0_0_28px_rgba(244,63,94,0.18)]',
      action: () => { setActiveForm('bug'); document.getElementById('forms-section')?.scrollIntoView({ behavior: 'smooth' }); },
      label: 'Report Issue',
      btnClass: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'feature',
      title: 'Feature Request',
      desc: 'Have an idea to make LOFIRIYA better? We would love to hear it.',
      icon: Rocket,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/15 border-primary/25',
      cardBorder: 'border-primary/18 hover:border-primary/45',
      glow: 'hover:shadow-[0_0_28px_theme(colors.primary.DEFAULT/0.18)]',
      action: () => { setActiveForm('feature'); document.getElementById('forms-section')?.scrollIntoView({ behavior: 'smooth' }); },
      label: 'Submit Suggestion',
      btnClass: 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30',
    },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="aurora-blob w-[600px] h-[600px] bg-primary/10 -top-[18%] -left-[12%] rounded-full" />
        <div className="aurora-blob w-[400px] h-[400px] bg-[#5865F2]/8 bottom-[10%] -right-[8%] rounded-full" style={{ animationDelay: '-7s', animationDuration: '24s' }} />
      </div>

      <div className="relative z-10">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="pt-32 pb-12 text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-6">
              <Headphones className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Support Center</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white leading-tight mb-5">
              LOFIRIYA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                Support Center
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Need help? Report bugs, request features, or contact our support team — we are here for you.
            </p>
          </motion.div>
        </section>

        {/* ══ SUPPORT OPTIONS ═══════════════════════════════════════════════ */}
        <section className="pb-14 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {SUPPORT_OPTIONS.map((opt, i) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className={`p-6 rounded-2xl bg-white/[0.03] border ${opt.cardBorder} ${opt.glow} transition-all duration-300 flex flex-col`}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${opt.iconBg}`}>
                  <opt.icon className={`w-6 h-6 ${opt.iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-white text-base mb-2">{opt.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{opt.desc}</p>
                <button
                  onClick={opt.action}
                  className={`w-full h-10 rounded-xl text-sm font-medium transition-all duration-200 ${opt.btnClass}`}
                >
                  {opt.label}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ FORMS ═════════════════════════════════════════════════════════ */}
        <section id="forms-section" className="py-14 px-4 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-3xl mx-auto">
            {/* Tab switcher */}
            <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-white/[0.03] border border-white/8 w-fit">
              {(['bug', 'feature'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveForm(tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeForm === tab
                      ? tab === 'bug'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-primary text-white shadow-[0_0_14px_theme(colors.primary.DEFAULT/0.4)]'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab === 'bug' ? <Bug className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
                  {tab === 'bug' ? 'Bug Report' : 'Feature Request'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeForm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/8"
              >
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeForm === 'bug' ? 'bg-rose-500/15 border border-rose-500/25' : 'bg-primary/15 border border-primary/25'
                  }`}>
                    {activeForm === 'bug'
                      ? <Bug className="w-5 h-5 text-rose-400" />
                      : <Rocket className="w-5 h-5 text-primary" />
                    }
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white text-lg">
                      {activeForm === 'bug' ? 'Submit a Bug Report' : 'Submit a Feature Request'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {activeForm === 'bug'
                        ? 'All reports are sent directly to our team via Discord.'
                        : 'Your suggestion will be reviewed by the LOFIRIYA team.'}
                    </p>
                  </div>
                </div>

                {activeForm === 'bug' ? <BugReportForm /> : <FeatureRequestForm />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ══ FAQ ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-sm">Can't find the answer? Join our Discord server — our team responds fast.</p>
            </motion.div>
            <div className="space-y-2.5">
              {FAQS.map((faq, i) => <FAQItem key={faq.q} faq={faq} index={i} />)}
            </div>
          </div>
        </section>

        {/* ══ COMMUNITY CARD ════════════════════════════════════════════════ */}
        <section className="py-8 pb-20 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/12 via-background to-primary/8 p-8 md:p-12 text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-28 bg-[#5865F2]/15 blur-3xl pointer-events-none" />
              <div className="relative inline-flex w-16 h-16 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/35 items-center justify-center mb-6 mx-auto shadow-[0_0_22px_rgba(88,101,242,0.35)]">
                <SiDiscord className="w-7 h-7 text-[#5865F2]" />
              </div>
              <h2 className="relative text-2xl md:text-3xl font-display font-bold text-white mb-3">Join The Community</h2>
              <p className="relative text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed text-sm">
                Chat with thousands of LOFIRIYA users, get real-time updates, support and announcements directly from the team.
              </p>
              <div className="relative flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 h-11 font-medium shadow-[0_0_18px_rgba(88,101,242,0.4)] hover:shadow-[0_0_28px_rgba(88,101,242,0.6)] transition-all gap-2 text-sm"
                  onClick={() => window.open(DISCORD_LINK, '_blank')}
                >
                  <SiDiscord className="w-4 h-4" />
                  Join Discord Server
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

              {/* Social proof */}
              <div className="relative flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/6">
                {[['80K+', 'Community Members'], ['60+', 'Servers'], ['99.9%', 'Uptime']].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <p className="font-display font-bold text-white text-lg">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}

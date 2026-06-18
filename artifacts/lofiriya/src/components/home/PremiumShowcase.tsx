import { motion } from 'framer-motion';
import { Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const benefits = [
  '200% Volume Control',
  'Premium Audio Filters',
  'Unlimited Playback',
  'Priority Voice Nodes',
  'Early Access Features',
  'Premium Support'
];

export function PremiumShowcase() {
  return (
    <section className="py-32 relative bg-background overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-accent/20 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-surface/40 backdrop-blur-2xl border border-accent/30 rounded-[3rem] p-8 md:p-16 shadow-[0_0_100px_theme(colors.accent.DEFAULT/0.2)] text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 text-accent mb-8 shadow-[0_0_30px_theme(colors.accent.DEFAULT/0.4)]">
            <Crown className="w-8 h-8" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 text-glow-accent">
            Elevate Your Server
          </h2>
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Unlock the ultimate audio experience with LOFIRIYA Premium. Because your community deserves the best.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-12">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_theme(colors.accent.DEFAULT/0.5)]">
                  <Check className="w-4 h-4 text-[#050505]" />
                </div>
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <Link href="/premium">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-[#050505] font-bold text-lg h-14 px-10 shadow-[0_0_20px_theme(colors.accent.DEFAULT/0.5)] hover:shadow-[0_0_40px_theme(colors.accent.DEFAULT/0.7)] hover:scale-105 transition-all">
              Upgrade to Premium
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

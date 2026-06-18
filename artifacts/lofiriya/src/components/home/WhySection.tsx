import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Terminal, Search, Headphones, Users } from 'lucide-react';

const features = [
  { id: 1, title: 'Lightning Fast', desc: 'Optimized Lavalink nodes ensure instant playback with zero buffering.', icon: Zap },
  { id: 2, title: 'Reliable Streaming', desc: '99.9% uptime. Music never stops, even during peak Discord hours.', icon: ShieldCheck },
  { id: 3, title: 'Easy Slash Commands', desc: 'Intuitive modern Discord slash commands with autocomplete support.', icon: Terminal },
  { id: 4, title: 'Smart Search', desc: 'Find exactly what you want across multiple platforms instantly.', icon: Search },
  { id: 5, title: 'Premium Audio', desc: 'High-fidelity streaming with custom equalizers and bass boost.', icon: Headphones },
  { id: 6, title: 'Community Focused', desc: 'Built for large servers. Advanced permissions and DJ roles.', icon: Users }
];

export function WhySection() {
  return (
    <section className="py-32 relative bg-background">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-6 text-glow"
          >
            Why Choose LOFIRIYA?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            We rebuilt the Discord music bot from the ground up to provide an unmatched audio experience. No compromises.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-surface/50 border border-white/5 hover:border-primary/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-[0_0_15px_theme(colors.primary.DEFAULT/0.2)] group-hover:shadow-[0_0_25px_theme(colors.primary.DEFAULT/0.5)]">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-glow">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

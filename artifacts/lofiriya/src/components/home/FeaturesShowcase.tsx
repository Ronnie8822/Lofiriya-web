import { motion } from 'framer-motion';

const showcaseItems = [
  'Play Music', 'Search Songs', 'Queue Management', 'Playlists', 
  'Lyrics', 'Filters', 'DJ Mode', 'Autoplay', '24/7 Mode', 'Premium Features'
];

export function FeaturesShowcase() {
  return (
    <section className="py-24 relative border-t border-white/5 bg-surface/20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 text-glow">Everything You Need</h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="px-6 py-3 rounded-full bg-surface border border-white/10 text-white font-medium hover:border-primary hover:bg-primary/10 hover:text-glow hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT/0.3)] cursor-default transition-all"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

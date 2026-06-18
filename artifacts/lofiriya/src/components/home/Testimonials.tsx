import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  { id: 1, name: 'CyberDJ', init: 'C', bg: 'bg-red-500', text: 'The audio quality is actually insane compared to other bots. We use it for our weekly listen parties.' },
  { id: 2, name: 'NeonNinja', init: 'N', bg: 'bg-blue-500', text: 'Filters are top tier. 24/7 mode means our lofi channel never stops. Worth every penny.' },
  { id: 3, name: 'SynthWave', init: 'S', bg: 'bg-purple-500', text: 'Finally a bot that looks as good as it sounds. The commands are super intuitive.' },
  { id: 4, name: 'PixelPunk', init: 'P', bg: 'bg-green-500', text: 'Support team is incredibly fast. Uptime is exactly as advertised.' },
  { id: 5, name: 'AudioWeeb', init: 'A', bg: 'bg-yellow-500', text: 'Replaced 3 different bots in our server with just this one. It does everything.' },
  { id: 6, name: 'BassDrop', init: 'B', bg: 'bg-pink-500', text: 'The UI on the dashboard is beautiful. Premium features actually feel premium.' }
];

export function Testimonials() {
  return (
    <section className="py-24 relative bg-background overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-glow">Loved by Communities</h2>
      </div>

      <div className="relative w-full flex overflow-hidden">
        {/* Gradient fades for edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="animate-marquee hover:[animation-play-state:paused] flex gap-6 py-4">
          {[...reviews, ...reviews].map((review, i) => (
            <div 
              key={`${review.id}-${i}`}
              className="w-[350px] flex-shrink-0 bg-surface/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm"
            >
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${review.bg} flex items-center justify-center text-white font-bold`}>
                  {review.init}
                </div>
                <span className="font-medium text-white">{review.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

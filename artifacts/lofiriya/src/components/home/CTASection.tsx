import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-32 relative bg-background overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-aurora mix-blend-screen" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 text-glow leading-tight">
            Ready To Transform Your Discord Server?
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-12 h-16 text-xl rounded-full shadow-[0_0_30px_theme(colors.primary.DEFAULT/0.6)] hover:shadow-[0_0_50px_theme(colors.primary.DEFAULT/0.8)] transition-all w-full sm:w-auto"
              onClick={() => window.open('https://discord.com/oauth2/authorize?client_id=1345441002118320128&permissions=4785212247895241&integration_type=0&scope=bot', '_blank')}
            >
              Invite Bot
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 hover:bg-white/10 px-12 h-16 text-xl rounded-full bg-surface/50 backdrop-blur-md w-full sm:w-auto text-white"
              onClick={() => window.open('https://discord.gg/5gcFVbnxxF', '_blank')}
            >
              Support Server
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

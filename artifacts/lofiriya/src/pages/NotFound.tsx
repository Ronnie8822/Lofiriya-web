import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="pt-24 min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden bg-background">
      
      {/* Floating Notes Background */}
      {[1, 2, 3, 4, 5].map(i => (
        <motion.div
          key={i}
          className="absolute text-primary/20"
          animate={{ 
            y: [-20, 20],
            rotate: [0, 360]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3 + i,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{
            left: `${20 + (i * 15)}%`,
            top: `${30 + (i * 10)}%`,
            scale: 1 + (i * 0.2)
          }}
        >
          <Music className="w-12 h-12" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center flex flex-col items-center"
      >
        <div className="text-[150px] font-display font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary to-accent mb-4 text-glow">
          404
        </div>
        
        <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
          Lost In The Music?
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10">
          The track you're looking for doesn't exist on this server. Let's get you back to the main stage.
        </p>

        {/* Small waveform animation */}
        <div className="flex items-center justify-center gap-1.5 mb-10 h-10">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <motion.div
              key={i}
              className="w-1.5 bg-primary rounded-full"
              animate={{ height: ['20%', '100%', '20%'] }}
              transition={{
                repeat: Infinity,
                duration: 1,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <Link href="/">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 h-14 text-lg shadow-[0_0_20px_theme(colors.primary.DEFAULT/0.4)]">
            Take Me Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

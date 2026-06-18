import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

const commands = [
  { user: "/play lofi hip hop", bot: "Now playing \"lofi hip hop radio\" in #music", highlight: "lofi hip hop radio" },
  { user: "/queue", bot: "1. lofi hip hop radio\n2. chill beats to study to\n3. midnight vibes", highlight: "" },
  { user: "/filter bassboost", bot: "Bass boost enabled! 🎧", highlight: "Bass boost" }
];

export function CommandDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % commands.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 relative bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-[#1e1f22] rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm">
          {/* Header */}
          <div className="bg-[#2b2d31] px-4 py-3 flex items-center gap-3 border-b border-white/5">
            <Terminal className="w-5 h-5 text-muted-foreground" />
            <span className="text-white/80 font-semibold">Discord Commands</span>
          </div>
          
          {/* Body */}
          <div className="p-6 flex flex-col gap-6 min-h-[300px]">
            {commands.map((cmd, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: i <= step ? 1 : 0, 
                  y: i <= step ? 0 : 10 
                }}
                className={`flex flex-col gap-2 ${i > step ? 'hidden' : ''}`}
              >
                {/* User Command */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">U</div>
                  <div className="bg-[#2b2d31] px-4 py-2 rounded-lg text-white inline-block">
                    <span className="text-primary font-semibold">{cmd.user.split(' ')[0]}</span>{' '}
                    <span className="text-white/70">{cmd.user.substring(cmd.user.indexOf(' ') + 1)}</span>
                  </div>
                </div>
                
                {/* Bot Response */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-3 ml-4"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">L</div>
                  <div className="bg-primary/10 border border-primary/20 px-4 py-3 rounded-lg text-white/90 whitespace-pre-wrap">
                    {cmd.bot}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
            }

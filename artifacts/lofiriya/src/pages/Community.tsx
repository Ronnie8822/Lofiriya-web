import { motion } from 'framer-motion';
import { Users, MessagesSquare } from 'lucide-react';

const servers = [
  { name: 'Lofi Girl', members: '1.2M', color: 'bg-orange-500' },
  { name: 'Anime Soul', members: '850K', color: 'bg-pink-500' },
  { name: 'Study Together', members: '450K', color: 'bg-blue-500' },
  { name: 'Gamer Hub', members: '200K', color: 'bg-green-500' },
  { name: 'Chill Vibes', members: '150K', color: 'bg-purple-500' },
  { name: 'Developer Den', members: '100K', color: 'bg-zinc-500' }
];

export default function Community() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 text-glow">Our Community</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Join millions of users experiencing music together. Be part of the largest audio community on Discord.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-10 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <div className="text-5xl font-bold text-white mb-2">2.5M+</div>
            <div className="text-primary font-medium uppercase tracking-widest">Total Users</div>
          </div>
          <div className="bg-accent/10 border border-accent/20 rounded-3xl p-10 text-center">
            <MessagesSquare className="w-12 h-12 text-accent mx-auto mb-4" />
            <div className="text-5xl font-bold text-white mb-2">15K+</div>
            <div className="text-accent font-medium uppercase tracking-widest">Active Servers</div>
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-white mb-8">Featured Servers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {servers.map((server, i) => (
            <motion.div
              key={server.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4 hover:bg-surface transition-colors"
            >
              <div className={`w-16 h-16 rounded-xl ${server.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                {server.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{server.name}</h3>
                <p className="text-muted-foreground">{server.members} Members</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

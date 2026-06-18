import { motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const posts = [
  { id: 1, title: 'LOFIRIYA v3.0: The Audio Engine Rewrite', category: 'Updates', date: 'Jun 15, 2025', image: 'bg-primary/20' },
  { id: 2, title: 'How to setup the perfect Lofi 24/7 Server', category: 'Tutorials', date: 'Jun 10, 2025', image: 'bg-accent/20' },
  { id: 3, title: 'Introducing Advanced DJ Roles', category: 'Features', date: 'Jun 05, 2025', image: 'bg-purple-500/20' },
  { id: 4, title: 'We crossed 15,000 servers!', category: 'Announcements', date: 'May 28, 2025', image: 'bg-blue-500/20' },
  { id: 5, title: 'Understanding Audio Filters', category: 'Tutorials', date: 'May 15, 2025', image: 'bg-green-500/20' },
  { id: 6, title: 'Spotify Integration Improvements', category: 'Updates', date: 'May 02, 2025', image: 'bg-orange-500/20' }
];

const tags = ['All', 'Updates', 'Tutorials', 'Features', 'Announcements'];

export default function Blog() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 text-glow">The Note</h1>
          <p className="text-lg text-muted-foreground">News, updates, and guides from the LOFIRIYA team.</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex flex-wrap gap-2 justify-center">
            {tags.map(tag => (
              <button key={tag} className="px-4 py-2 rounded-full text-sm font-medium bg-surface border border-white/10 text-muted-foreground hover:text-white transition-colors">
                {tag}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search articles..." className="pl-10 bg-surface/50 border-white/10" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className={`w-full aspect-[4/3] rounded-2xl ${post.image} mb-6 overflow-hidden border border-white/5 group-hover:border-primary/50 transition-colors relative`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{post.category}</span>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-glow transition-all">{post.title}</h3>
              <div className="flex items-center text-sm font-medium text-white/70 group-hover:text-primary transition-colors">
                Read Article <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

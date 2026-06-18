import { motion } from 'framer-motion';
import { SiYoutube, SiSpotify, SiSoundcloud } from 'react-icons/si';

function DeezerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.944 13.505H24v1.733h-5.056zM18.944 10.762H24v1.734h-5.056zM18.944 16.248H24v1.733h-5.056zM18.944 8H24v1.733h-5.056zM12.613 13.505h5.056v1.733h-5.056zM12.613 10.762h5.056v1.734h-5.056zM12.613 16.248h5.056v1.733h-5.056zM6.279 13.505h5.056v1.733H6.279zM6.279 16.248h5.056v1.733H6.279zM0 16.248h5.056v1.733H0z" />
    </svg>
  );
}

function AppleMusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a6.33 6.33 0 0 0-1.117-.486 9.591 9.591 0 0 0-1.394-.2c-.248-.02-.496-.04-.744-.04H5.718c-.248 0-.496.02-.744.04a9.591 9.591 0 0 0-1.394.2c-.42.112-.827.263-1.217.49C1.27 1.58.53 2.58.21 3.89a8.8 8.8 0 0 0-.195 1.524c-.01.268-.015.535-.015.803v11.566c0 .267.005.534.015.802A8.8 8.8 0 0 0 .21 20.11c.32 1.31 1.06 2.31 2.153 3.044a6.33 6.33 0 0 0 1.217.49 9.591 9.591 0 0 0 1.394.2c.248.02.496.03.744.03H18.3c.248 0 .496-.01.744-.03a9.591 9.591 0 0 0 1.394-.2 6.33 6.33 0 0 0 1.117-.49c1.118-.733 1.863-1.733 2.18-3.043.158-.616.23-1.245.24-1.884.01-.268.006-.535.006-.803V6.927c0-.268.004-.535-.006-.803zm-6.967 7.012v3.68c0 1.34-.986 2.264-2.318 2.057a1.897 1.897 0 0 1-1.594-1.836c.034-.966.743-1.742 1.7-1.862.328-.043.66-.007.99-.007V9.623l-5.867 1.308v5.445c0 .34.007.68-.01 1.02-.053.987-.805 1.82-1.787 1.977-1.34.208-2.535-.716-2.535-2.066a1.917 1.917 0 0 1 1.538-1.874c.33-.065.665-.03 1-.03v-7.05c0-.595.428-1.048 1.016-1.158l6.69-1.49c.73-.163 1.177.268 1.177 1.007v5.424z"/>
    </svg>
  );
}

const platforms = [
  {
    id: 'yt',
    name: 'YouTube',
    Icon: SiYoutube,
    color: '#FF0000',
    glow: 'rgba(255,0,0,0.28)',
    desc: 'Full library access',
  },
  {
    id: 'sp',
    name: 'Spotify',
    Icon: SiSpotify,
    color: '#1DB954',
    glow: 'rgba(29,185,84,0.28)',
    desc: 'Playlist & track links',
  },
  {
    id: 'sc',
    name: 'SoundCloud',
    Icon: SiSoundcloud,
    color: '#FF5500',
    glow: 'rgba(255,85,0,0.28)',
    desc: 'Independent artists',
  },
  {
    id: 'dz',
    name: 'Deezer',
    Icon: DeezerIcon,
    color: '#A238FF',
    glow: 'rgba(162,56,255,0.28)',
    desc: 'Hi-Fi streaming',
  },
  {
    id: 'am',
    name: 'Apple Music',
    Icon: AppleMusicIcon,
    color: '#FC3C44',
    glow: 'rgba(252,60,68,0.28)',
    desc: '100M+ songs',
  },
];

export function PlatformsSection() {
  return (
    <section className="py-24 relative overflow-hidden border-y border-white/5 bg-surface/30">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-4">Seamless Integration</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-glow mb-4">
            Play From Anywhere
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-base">
            Stream music from every major platform directly in your Discord server — no extra setup needed.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10 lg:gap-14">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 24, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 18 }}
              whileHover={{ scale: 1.08, y: -5 }}
              className="group flex flex-col items-center gap-3 w-28"
              data-testid={`platform-${platform.id}`}
            >
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-surface border border-white/8 flex items-center justify-center transition-all duration-300 group-hover:border-white/20"
                style={{ transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px 4px ${platform.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <platform.Icon
                  className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-110"
                  style={{ color: platform.color }}
                />
              </div>
              <div>
                <p className="font-semibold text-white/80 group-hover:text-white transition-colors text-sm">
                  {platform.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {platform.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

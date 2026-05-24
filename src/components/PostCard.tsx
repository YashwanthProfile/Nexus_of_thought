import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Tag as TagIcon, ArrowRight } from 'lucide-react';
import { PostSummary } from '../types';

interface PostCardProps {
  post: PostSummary;
  index: number;
}

function getDeterministicRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function() {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

function PlaceholderHero({ slug }: { slug: string; title: string }) {
  const rand = getDeterministicRandom(slug);
  const cols = 12;
  const rows = 8;
  const tiles = [];

  const cx = cols / 2;
  const cy = rows / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = c - cx;
      const dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDist = dist / maxDist; // 0 to 1

      const roll = rand();
      let type: 'none' | 'gray' | 'orange' = 'none';
      if (roll < 0.28) {
        type = 'orange';
      } else if (roll < 0.72) {
        type = 'gray';
      }

      // Calculate opacity and blur levels based on distance to the edge
      const opacity = Math.max(0.02, 1 - normalizedDist * 0.9);
      const blurLevel = normalizedDist > 0.75 ? 'blur-[2.5px]' : normalizedDist > 0.45 ? 'blur-[1px]' : 'blur-none';

      tiles.push({
        id: `${r}-${c}`,
        type,
        opacity,
        blurLevel,
      });
    }
  }

  return (
    <div className="w-full h-full bg-[#fdfdfc] relative flex flex-col justify-between p-3 select-none overflow-hidden transition-colors">
      {/* Render gray and orange tiles in a grid */}
      <div className="absolute inset-0 grid grid-cols-12 gap-1 p-2">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            style={{ opacity: tile.opacity }}
            className={`w-full h-full rounded-sm transition-all duration-500 ${tile.blurLevel} ${
              tile.type === 'orange'
                ? 'bg-[#ea580c]'
                : tile.type === 'gray'
                ? 'bg-gray-300'
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Radial fade matching background to create edge-blur effect */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 15%, #fdfdfc 90%)'
        }}
      />

      {/* Static minimalist brand watermark stamp */}
      <div className="z-10 mt-auto ml-auto bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded border border-gray-100/50">
        <span className="text-[8px] font-black tracking-[0.25em] text-gray-500 font-sans leading-none uppercase">
          NEXUS OF THOUGHT
        </span>
      </div>
    </div>
  );
}

export const PostCard = memo(function PostCard({ post, index }: PostCardProps) {
  const prefetchPost = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/api/posts/${post.slug}`;
    document.head.appendChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
      onMouseEnter={prefetchPost}
    >
      <Link to={`/post/${post.slug}`} className="block">
        <article className="py-10 border-b border-gray-100 last:border-0 flex flex-col md:flex-row gap-8 items-start">
          {/* Hero Image / Featured Image Tile on the Left */}
          <div className="w-full md:w-52 h-40 md:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative shadow-sm">
            {post.heroImage ? (
              <img 
                src={post.heroImage} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <PlaceholderHero slug={post.slug} title={post.title} />
            )}
          </div>

          {/* Post content details on the right */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded">
                <Calendar className="w-3 h-3" />
                {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-orange-600 transition-colors">
              {post.title}
            </h2>

            <p className="text-gray-500 text-base leading-relaxed mb-4 line-clamp-2">
              {post.summary}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-all opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0">
                Read Dive <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
});

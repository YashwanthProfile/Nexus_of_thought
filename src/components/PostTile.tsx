import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star } from 'lucide-react';
import { PostSummary } from '../types';

interface PostTileProps {
  post: PostSummary;
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

function TilePlaceholderHero({ slug }: { slug: string }) {
  const rand = getDeterministicRandom(slug);
  const cols = 10;
  const rows = 6;
  const tiles = [];

  const cx = cols / 2;
  const cy = rows / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = c - cx;
      const dy = r - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDist = dist / maxDist;

      const roll = rand();
      let type: 'none' | 'gray' | 'orange' = 'none';
      if (roll < 0.28) {
        type = 'orange';
      } else if (roll < 0.72) {
        type = 'gray';
      }

      const opacity = Math.max(0.02, 1 - normalizedDist * 0.9);
      const blurLevel = normalizedDist > 0.7 ? 'blur-[2px]' : 'blur-none';

      tiles.push({
        id: `${r}-${c}`,
        type,
        opacity,
        blurLevel,
      });
    }
  }

  return (
    <div className="w-full h-full bg-[#fdfdfc] relative flex flex-col justify-between p-3 select-none overflow-hidden border border-gray-100 rounded-lg">
      <div className="absolute inset-0 grid grid-cols-10 gap-1 p-1">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            style={{ opacity: tile.opacity }}
            className={`w-full h-full rounded-sm transition-all duration-300 ${tile.blurLevel} ${
              tile.type === 'orange'
                ? 'bg-[#ea580c]'
                : tile.type === 'gray'
                ? 'bg-gray-300'
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, #fdfdfc 92%)'
        }}
      />

      <div className="z-10 mt-auto ml-auto bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded border border-gray-100">
        <span className="text-[7px] font-black tracking-[0.2em] text-gray-400 font-sans leading-none uppercase">
          NEXUS
        </span>
      </div>
    </div>
  );
}

export const PostTile = memo(function PostTile({ post }: PostTileProps) {
  return (
    <article className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-100/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-200/60 overflow-hidden">
      {/* Top Banner Crop */}
      <div className="w-full h-36 bg-gray-50 rounded-xl overflow-hidden mb-5 border border-gray-100 relative">
        {post.heroImage ? (
          <img 
            src={post.heroImage} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <TilePlaceholderHero slug={post.slug} />
        )}
      </div>

      {/* Post Metadata row */}
      <div className="flex items-center gap-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-300" />
          {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
        </span>
        <span className="w-1 h-1 rounded-full bg-gray-200" />
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-300" />
          {post.tags?.[0] || 'Note'}
        </span>
      </div>

      {/* Main Link Area */}
      <Link to={`/post/${post.slug}`} className="flex-1 flex flex-col">
        <h3 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug mb-3">
          {post.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-6">
          {post.summary}
        </p>

        {/* Footer info: Author Badge and Tags */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-widest text-orange-600/70 uppercase">
            {(() => {
              if (!post.authorId) return 'J. Dehn';
              const parts = typeof post.authorId === 'string' 
                ? post.authorId.split(',').map(s => s.trim()) 
                : post.authorId;
              
              const names = parts.map(id => {
                if (id === 'am_turing') return 'A. Turing';
                if (id === 'c_shannon') return 'C. Shannon';
                if (id === 'l_euler') return 'L. Euler';
                if (id === 'h_poincare') return 'H. Poincaré';
                return 'J. Dehn';
              });
              return names.join(' & ');
            })()}
          </span>
          <div className="flex gap-1 overflow-hidden max-w-[60%]">
            {post.tags?.slice(1, 3).map(tag => (
              <span key={tag} className="text-[8px] font-bold tracking-wider uppercase bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
});

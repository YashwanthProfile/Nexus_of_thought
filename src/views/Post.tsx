import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, Link2 as LinkIcon, Linkedin, Twitter, Mail, Check } from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Post as PostType } from '../types';
import { AUTHORS } from '../data/authors';
import { motion } from 'motion/react';
import { safeFetch } from '../utils/api';

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

function PlaceholderHeroBanner({ slug }: { slug: string; title: string }) {
  const rand = getDeterministicRandom(slug);
  const cols = 18;
  const rows = 10;
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
      const opacity = Math.max(0.01, 1 - normalizedDist * 0.95);
      const blurLevel = normalizedDist > 0.75 ? 'blur-[3px]' : normalizedDist > 0.45 ? 'blur-[1.5px]' : 'blur-none';

      tiles.push({
        id: `${r}-${c}`,
        type,
        opacity,
        blurLevel,
      });
    }
  }

  return (
    <div className="w-full h-full bg-[#fdfdfc] relative flex flex-col justify-between p-6 md:p-8 select-none overflow-hidden transition-colors">
      {/* Grid of high-contrast gray and orange tiles */}
      <div className="absolute inset-0 grid grid-cols-18 gap-1 p-3">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            style={{ opacity: tile.opacity }}
            className={`w-full h-full rounded transition-all duration-500 ${tile.blurLevel} ${
              tile.type === 'orange'
                ? 'bg-[#ea580c] shadow shadow-orange-500/25'
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
          background: 'radial-gradient(circle at center, transparent 15%, #fdfdfc 88%)'
        }}
      />

      {/* Static minimalist brand watermark stamp */}
      <div className="z-10 mt-auto ml-auto bg-white/90 backdrop-blur px-3 py-1 rounded border border-gray-100 shadow-sm">
        <span className="text-[10px] font-black tracking-[0.3em] text-gray-900 font-sans leading-none uppercase">
          NEXUS OF THOUGHT
        </span>
      </div>
    </div>
  );
}

export function Post() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    safeFetch<PostType>(`/api/posts/${slug}`)
      .then(data => setPost(data))
      .catch(err => console.error("Could not load post:", err))
      .finally(() => setIsLoading(false));
      
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) return (
    <div className="max-w-4xl mx-auto py-24 pt-32 px-8 animate-pulse text-center">
      <div className="h-10 bg-gray-100 rounded-full w-48 mx-auto mb-12" />
      <div className="h-20 bg-gray-50 rounded-2xl w-3/4 mx-auto mb-6" />
      <div className="h-4 bg-gray-50 rounded w-1/4 mx-auto mb-20" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-50 rounded w-full" />
        <div className="h-4 bg-gray-50 rounded w-5/6" />
        <div className="h-4 bg-gray-50 rounded w-full" />
      </div>
    </div>
  );

  if (!post) return (
    <div className="flex flex-col items-center justify-center h-screen py-24">
      <h1 className="text-4xl font-bold mb-4">Post not found</h1>
      <Link to="/" className="text-orange-600 font-bold hover:underline">Back to feed</Link>
    </div>
  );

  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Clean the markdown content to strip any initial repeated H1 header if present
  const cleanContent = post.content.replace(/^\s*#\s+[^\r\n]+(\r?\n)*/, '');

  return (
    <div className="max-w-4xl mx-auto py-12 lg:py-12 pt-24 px-8">
      <motion.nav 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-12"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" />
          Back to Archives
        </Link>
      </motion.nav>

      <article className="mb-24">
        <header className="mb-12">
          <div className="flex flex-wrap gap-3 mb-6">
            {post.metadata.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                {tag}
              </span>
            ))}
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-[0.95] text-gray-900"
          >
            {post.metadata.title}
          </motion.h1>

          {/* Hero Image (Technical/Standard Name for Post Title Image) right below animation title */}
          <div className="w-full h-64 md:h-96 my-8 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 relative shadow-sm">
            {post.metadata.heroImage ? (
              <img 
                src={post.metadata.heroImage} 
                alt={post.metadata.title} 
                className="w-full h-full object-cover"
                decoding="async"
              />
            ) : (
              <PlaceholderHeroBanner slug={slug || ''} title={post.metadata.title} />
            )}
          </div>

          {/* Metadata details containing date, read time, word count and share triggers */}
          <div className="flex items-center justify-between py-6 border-y border-gray-100 mb-12">
            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                ~{readingTime} min read
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase font-black bg-gray-50 px-2 py-0.5 rounded text-gray-400">{wordCount} words</span>
              </span>
            </div>
            
            <div className="relative" ref={shareDropdownRef}>
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-mono text-gray-500 hover:text-orange-600 border border-gray-100 rounded-xl hover:border-orange-500 hover:shadow-2xs transition-all bg-white"
                aria-label="Share article"
              >
                <Share2 className="w-3.5 h-3.5" />
                SHARE
              </button>

              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono border-b border-gray-50 mb-1">
                    Share Note
                  </div>
                  
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left font-sans cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                      {copied ? 'Copied Link!' : 'Copy Link'}
                    </span>
                    {copied && <Check className="w-3.5 h-3.5 text-green-600" />}
                  </button>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left font-sans"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                    LinkedIn
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.metadata.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left font-sans"
                  >
                    <Twitter className="w-3.5 h-3.5 text-sky-500" />
                    X / Twitter
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(post.metadata.title)}&body=${encodeURIComponent("Check out this research note: " + window.location.href)}`}
                    onClick={() => setShowShareMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left font-sans"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    Email
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        <MarkdownRenderer content={cleanContent} />

        {post.backlinks && post.backlinks.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-24 pt-12 border-t border-gray-100"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Connected Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.backlinks.map(link => (
                <Link 
                  key={link.slug} 
                  to={`/post/${link.slug}`}
                  className="p-6 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                >
                  <h4 className="font-bold mb-2 group-hover:text-orange-600 transition-colors uppercase tracking-tight text-gray-900">{link.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{link.summary}</p>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </article>

      <footer className="pt-12 border-t border-gray-100 mb-12">
        {(() => {
          // Resolve creators list
          const authorIds: string[] = [];
          const postMeta = post.metadata as any;
          if (postMeta.authorId) {
            if (typeof postMeta.authorId === 'string') {
              postMeta.authorId.split(',').map((s: string) => s.trim()).forEach((id: string) => authorIds.push(id));
            } else if (Array.isArray(postMeta.authorId)) {
              postMeta.authorId.forEach((id: string) => authorIds.push(id));
            }
          } else {
            authorIds.push('jd_doe');
          }

          const contributorIds: string[] = postMeta.contributors || [];
          
          return (
            <div className="bg-gray-50/50 border border-gray-100/80 rounded-2xl p-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 font-mono">Lead Authors</h4>
                <div className="flex flex-wrap gap-4">
                  {authorIds.map(id => {
                    const author = AUTHORS[id] || AUTHORS['jd_doe'];
                    if (!author) return null;
                    const initials = author.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                    
                    return (
                      <Link 
                        key={id} 
                        to="/authors" 
                        className="flex items-center gap-3 bg-white border border-gray-200/60 px-4 py-2.5 rounded-xl hover:border-orange-500 hover:shadow-sm transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center font-mono font-extrabold text-xs text-orange-700 overflow-hidden">
                          {author.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{author.name}</p>
                          <p className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-wider">{author.title}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {contributorIds.length > 0 && (
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 font-mono">Contributors to this Note</h4>
                  <div className="flex flex-wrap gap-4">
                    {contributorIds.map(cId => {
                      const c = AUTHORS[cId];
                      if (!c) return null;
                      const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                      return (
                        <Link 
                          key={cId} 
                          to="/authors" 
                          className="flex items-center gap-3 bg-white border border-gray-200/60 px-4 py-2.5 rounded-xl hover:border-orange-505 hover:shadow-sm transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs text-orange-600 overflow-hidden">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{c.name}</p>
                            <p className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-wider">{c.title}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </footer>
    </div>
  );
}

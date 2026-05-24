import { useState, useEffect } from 'react';
import { PostSummary } from '../types';
import { PostTile } from '../components/PostTile';
import { Search, Sparkles, Tag, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AUTHORS } from '../data/authors';
import { safeFetch } from '../utils/api';

const DEFAULT_FEATURED_SLUGS = [
  'understanding-attention',
  'kalman-filter',
  'pid-control-deep-dive',
  'optimal-control',
  'singular-value-decomposition',
  'svg-and-math'
];

export function Home() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';
  
  const [search, setSearch] = useState(initialSearch);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialSearch) {
      setSelectedTags(prev => {
        if (prev.some(t => t.toLowerCase() === initialSearch.toLowerCase())) return prev;
        return [...prev, initialSearch];
      });
      setSearch('');
    }
  }, [initialSearch]);

  const addTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.some(t => t.toLowerCase() === tag.toLowerCase())) return prev;
      return [...prev, tag];
    });
    setSearch('');
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  useEffect(() => {
    safeFetch<PostSummary[]>('/api/posts')
      .then(data => {
        setPosts(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Compute tag counts and sort them
  const tagCounts = posts.reduce((acc, post) => {
    post.tags?.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // Filter posts search throughout ALL posts, supporting title, summary, tags, and author attributes
  const filteredPostsBySearch = posts.filter((post: any) => {
    // 1. If we have selectedTags, the post MUST contain all of them
    if (selectedTags.length > 0) {
      const matchAllTags = selectedTags.every(selTag => 
        post.tags?.some((pt: string) => pt.toLowerCase() === selTag.toLowerCase())
      );
      if (!matchAllTags) return false;
    }

    // 2. If we also have typed search term, filter further
    if (!search.trim()) return true;
    const term = search.toLowerCase();

    // Check if term matches title, summary, or tags
    if (
      post.title.toLowerCase().includes(term) ||
      post.summary.toLowerCase().includes(term) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(term))
    ) {
      return true;
    }

    // Check if term matches any of the authors/contributors of this post
    const authorIds: string[] = [];
    if (post.authorId) {
      if (typeof post.authorId === 'string') {
        post.authorId.split(',').map((s: string) => s.trim()).forEach((id: string) => authorIds.push(id));
      } else if (Array.isArray(post.authorId)) {
        post.authorId.forEach((id: string) => authorIds.push(id));
      }
    } else {
      authorIds.push('jd_doe'); // default fallback
    }

    if (post.contributors && Array.isArray(post.contributors)) {
      post.contributors.forEach((id: string) => authorIds.push(id));
    }

    return authorIds.some(id => {
      const auth = AUTHORS[id];
      return auth && (
        auth.name.toLowerCase().includes(term) ||
        auth.specialty.toLowerCase().includes(term) ||
        auth.title.toLowerCase().includes(term)
      );
    });
  });

  // Keep featured post display fixed, supporting both default static slugs and dynamic featured frontmatter flag
  const featuredPosts = posts.filter(post => DEFAULT_FEATURED_SLUGS.includes(post.slug) || (post as any).featured === true);
  const activeFeaturedList = featuredPosts.length > 0 ? featuredPosts : posts.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto py-12 lg:py-16 pt-24 px-8 lg:px-16 min-h-screen">
      <header className="mb-20">
        <h1 className="text-6xl font-extrabold tracking-tight mb-4 text-gray-950 font-sans leading-none uppercase">
          NEXUS OF THOUGHT
        </h1>
        <p className="text-lg text-gray-500 font-medium font-serif max-w-2xl leading-relaxed italic">
          Deep-dives, mathematical inquiries, signal diagnostics, control mechanics, simulations, and complex systems.
        </p>
        
        {/* Search controls */}
        <div className="mt-12 relative group max-w-3xl">
          <div className="w-full flex flex-wrap items-center gap-2 pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100 focus-within:border-orange-500/70 outline-none transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
            
            {/* Tag Chips */}
            {selectedTags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-100 text-xs font-bold text-orange-850 uppercase tracking-wider select-none animate-in fade-in duration-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="p-0.5 rounded-full hover:bg-orange-200 text-orange-755 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <input 
              type="text" 
              placeholder={selectedTags.length > 0 ? "" : "Search by keyword, author, area of study, mathematical term..."}
              className="flex-grow min-w-[200px] bg-transparent outline-none text-sm font-medium border-0 p-1 focus:ring-0 placeholder:text-gray-400 text-gray-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => {
                // Short timeout to let onMouseDown fire first
                setTimeout(() => setIsDropdownOpen(false), 200);
              }}
            />
          </div>

          {/* Keywords Dropdown */}
          {isDropdownOpen && sortedTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl p-6">
              <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2 font-mono">
                <Tag className="w-3.5 h-3.5 text-orange-500" />
                Popular Keywords (Toggle to Filter)
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {sortedTags.map(([tag, count]) => {
                  const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (isSelected) {
                          removeTag(tag);
                        } else {
                          addTag(tag);
                        }
                      }}
                      className={`group flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all text-left pointer-events-auto ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' 
                          : 'border-gray-100 hover:border-orange-500 hover:bg-orange-50 bg-white text-gray-600'
                      }`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isSelected ? 'text-orange-750' : 'text-gray-600 group-hover:text-orange-600'
                      }`}>
                        {tag}
                      </span>
                      <span className={`text-[10px] font-black ${
                        isSelected ? 'text-orange-400' : 'text-gray-300 group-hover:text-orange-300'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-gray-50 rounded-2xl border border-gray-100 p-5 flex flex-col justify-between">
              <div className="h-32 bg-gray-200/50 rounded-xl" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-gray-200/70 w-3/4 rounded-md" />
                <div className="h-3 bg-gray-200/50 w-full rounded-md" />
                <div className="h-3 bg-gray-200/50 w-2/3 rounded-md" />
              </div>
              <div className="h-5 bg-gray-200/30 w-1/3 rounded-sm mt-4" />
            </div>
          ))}
        </div>
      ) : (search || selectedTags.length > 0) ? (
        /* Search Query Grid View */
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-8">
            <h2 className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Search Results ({filteredPostsBySearch.length})
            </h2>
          </div>

          {filteredPostsBySearch.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/20">
              <p className="text-gray-400 font-medium italic mb-2">No research papers match your indexing query.</p>
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedTags([]);
                }} 
                className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPostsBySearch.map((post) => (
                <PostTile 
                  key={post.slug} 
                  post={post}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Featured Grid Dashboard - Fixed Grid Layout */
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 mb-8 gap-4">
            <h2 className="text-xs font-black tracking-widest text-gray-900 uppercase flex items-center gap-2.5 font-mono">
              Featured Dashboard Grid
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeFeaturedList.map((post) => (
              <PostTile 
                key={post.slug} 
                post={post}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

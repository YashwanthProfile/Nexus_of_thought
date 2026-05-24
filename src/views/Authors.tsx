import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Twitter, 
  Github, 
  Mail, 
  BookOpen, 
  Award, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  UserCheck 
} from 'lucide-react';
import { AUTHORS, Author } from '../data/authors';
import { PostSummary } from '../types';
import { PostCard } from '../components/PostCard';
import { safeFetch } from '../utils/api';

interface ContributorNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarPatternSeed: string;
  specialty: string;
  role: 'author' | 'editor' | 'reviewer';
  socialLinks?: {
    twitter?: string;
    github?: string;
    email?: string;
  };
  avatarUrl?: string;
}

interface ContributorLink {
  source: string | ContributorNode;
  target: string | ContributorNode;
  label: string;
}

export function Authors() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('jd_doe');
  const [isLoading, setIsLoading] = useState(true);
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<ContributorNode, undefined> | null>(null);

  // Load posts dynamically
  useEffect(() => {
    safeFetch<PostSummary[]>('/api/posts')
      .then(data => setPosts(data))
      .catch(err => console.error("Could not load authors posts:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedAuthor = AUTHORS[selectedId] || AUTHORS['jd_doe'];

  // Resolve associated contributions: Authors direct posts, or contributors to same post
  const getAssociatePosts = (contributorId: string) => {
    return posts.filter((post: any) => {
      // Check primary authors
      if (post.authorId) {
        if (typeof post.authorId === 'string') {
          const ids = post.authorId.split(',').map((id: string) => id.trim());
          if (ids.includes(contributorId)) return true;
        } else if (Array.isArray(post.authorId)) {
          if (post.authorId.includes(contributorId)) return true;
        }
      }

      // Check contributors list
      if (post.contributors) {
        if (Array.isArray(post.contributors)) {
          if (post.contributors.includes(contributorId)) return true;
        } else if (typeof post.contributors === 'string') {
          const ids = post.contributors.split(',').map((id: string) => id.trim());
          if (ids.includes(contributorId)) return true;
        }
      }

      // Fallback for default jd_doe if nothing else matches
      if (contributorId === 'jd_doe' && !post.authorId && !post.contributors) {
        return true;
      }

      return false;
    });
  };

  const relatedPosts = getAssociatePosts(selectedId);

  const getRoleGradient = (role: string) => {
    if (role === 'editor') return { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' }; // amber
    if (role === 'reviewer') return { bg: '#fce7f3', text: '#db2777', border: '#ec4899' }; // pink
    return { bg: '#ffedd5', text: '#ea580c', border: '#f97316' }; // orange/author
  };

  // Initialize and manage D3 force-directed simulation once (independent of selectedId selection)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 550;
    const height = 400;

    // Define nodes and structural links
    const nodes: ContributorNode[] = Object.values(AUTHORS).map(author => ({
      ...author,
      role: author.role || 'author',
    }));

    // Build undirected, related relationships dynamically from co-authorship & contributors info
    const getPostPersonnel = (post: any): string[] => {
      const ids: string[] = [];
      if (post.authorId) {
        if (typeof post.authorId === 'string') {
          post.authorId.split(',').map((id: string) => id.trim()).forEach((id: string) => {
            if (id) ids.push(id);
          });
        } else if (Array.isArray(post.authorId)) {
          post.authorId.forEach((id: string) => {
            if (id) ids.push(id);
          });
        }
      }
      if (post.contributors && Array.isArray(post.contributors)) {
        post.contributors.forEach((id: string) => {
          if (id) ids.push(id);
        });
      }
      return Array.from(new Set(ids));
    };

    const linksMap = new Map<string, ContributorLink>();

    posts.forEach((post: any) => {
      const personnel = getPostPersonnel(post);
      for (let i = 0; i < personnel.length; i++) {
        for (let j = i + 1; j < personnel.length; j++) {
          const a = personnel[i];
          const b = personnel[j];
          if (AUTHORS[a] && AUTHORS[b]) {
            const key = a < b ? `${a}-${b}` : `${b}-${a}`;
            if (!linksMap.has(key)) {
              linksMap.set(key, {
                source: a,
                target: b,
                label: `Collaborators on "${post.title}"`
              });
            }
          }
        }
      }
    });

    const links = Array.from(linksMap.values());

    // Seed defaults to avoid empty graph prior to API response
    if (links.length === 0) {
      const defaultLinks = [
        { source: 'c_shannon', target: 'am_turing', label: 'Theory' },
        { source: 'c_shannon', target: 'jd_doe', label: 'Systems' },
        { source: 'l_euler', target: 'c_shannon', label: 'Math' },
        { source: 'l_euler', target: 'jd_doe', label: 'Physics' },
        { source: 'h_poincare', target: 'jd_doe', label: 'Dynamics' }
      ];
      defaultLinks.forEach(lnk => links.push(lnk));
    }

    // Reset SVG
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Dynamically Register Clip Paths for nodes using custom avatars
    nodes.forEach(n => {
      const author = AUTHORS[n.id];
      if (author && author.avatarUrl) {
        defs.append('clipPath')
          .attr('id', `clip-${n.id}`)
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 23);
      }
    });

    const g = svg.append('g').attr('class', 'main-group');

    // Enable Zoom & Pan
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Initial transform (centered and fitted)
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.95));

    // Simulation setup (looser bounds and more negative charge for a breathing layout format)
    const simulation = d3.forceSimulation<ContributorNode>(nodes)
      .force('link', d3.forceLink<ContributorNode, ContributorLink>(links)
        .id(d => d.id)
        .distance(160)
      )
      .force('charge', d3.forceManyBody().strength(-550))
      .force('collision', d3.forceCollide().radius(55))
      .force('center', d3.forceCenter(0, 0))
      .alphaDecay(0.06);

    simulationRef.current = simulation;

    // Render edges - Undirected clean lines without arrowheads
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', d => {
        const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
        return (sId === selectedId || tId === selectedId) ? '#ea580c' : '#e2e8f0';
      })
      .attr('stroke-width', d => {
        const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
        return (sId === selectedId || tId === selectedId) ? 2.5 : 1.2;
      });

    // Render nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedId(d.id);
      })
      .call(d3.drag<SVGGElement, ContributorNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Node visuals - circle backgrounds
    node.append('circle')
      .attr('class', 'node-circle transition-all duration-300')
      .attr('r', d => d.id === selectedId ? 28 : 25)
      .attr('fill', d => getRoleGradient(d.role).bg)
      .attr('stroke', d => d.id === selectedId ? '#ea580c' : getRoleGradient(d.role).border)
      .attr('stroke-width', d => d.id === selectedId ? 3 : 1.5);

    // Conditional render: If author has avatarUrl, render SVG image clipped to circle; otherwise, standard text initials
    node.each(function(d) {
      const element = d3.select(this);
      const author = AUTHORS[d.id];
      if (author && author.avatarUrl) {
        element.append('image')
          .attr('href', author.avatarUrl)
          .attr('x', -23)
          .attr('y', -23)
          .attr('width', 46)
          .attr('height', 46)
          .attr('clip-path', `url(#clip-${d.id})`);
      } else {
        element.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.3em')
          .attr('font-size', '11px')
          .attr('font-weight', '900')
          .attr('font-family', 'var(--font-semibold), sans-serif')
          .attr('fill', getRoleGradient(d.role).text)
          .text(d.name.split(' ').map(n => n[0]).join('').slice(0, 2));
      }
    });

    // Capsule border labels displaying node identifiers
    node.append('rect')
      .attr('class', 'node-label-bg shadow-sm')
      .attr('x', -45)
      .attr('y', 33)
      .attr('width', 90)
      .attr('height', 16)
      .attr('rx', 4)
      .attr('fill', '#ffffff')
      .attr('stroke', d => d.id === selectedId ? '#fed7aa' : '#f1f5f9')
      .attr('stroke-width', 1);

    node.append('text')
      .attr('y', 44)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8.5px')
      .attr('font-weight', '800')
      .attr('font-family', 'var(--font-mono, monospace)')
      .attr('fill', '#475569')
      .text(d => d.name.replace(/(Dr\.|Prof\.)\s/, ''));

    // Simulation tick callback
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as ContributorNode).x || 0)
        .attr('y1', d => (d.source as ContributorNode).y || 0)
        .attr('x2', d => (d.target as ContributorNode).x || 0)
        .attr('y2', d => (d.target as ContributorNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Drag handlers
    function dragstarted(event: any, d: ContributorNode) {
      if (!event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: ContributorNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: ContributorNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Handle zoom / fit helpers with a 150ms debouncer
    let resizeTimer: any;
    const handleFit = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(w / 2, height / 2).scale(0.9));
      }, 150);
    };

    window.addEventListener('resize', handleFit);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleFit);
      simulation.stop();
    };
  }, [posts]);

  // Update styling dynamically when selectedId changes without recreating or resetting the physics simulation!
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Update node circles
    svg.selectAll<SVGCircleElement, ContributorNode>('circle.node-circle')
      .attr('stroke', d => d.id === selectedId ? '#ea580c' : getRoleGradient(d.role || 'author').border)
      .attr('stroke-width', d => d.id === selectedId ? 3 : 1.5)
      .attr('r', d => d.id === selectedId ? 28 : 25);

    // Update labels bounds borders
    svg.selectAll<SVGRectElement, ContributorNode>('rect.node-label-bg')
      .attr('stroke', d => d.id === selectedId ? '#fed7aa' : '#f1f5f9');

    // Update edges highlights
    svg.selectAll<SVGLineElement, ContributorLink>('line.graph-link')
      .attr('stroke', d => {
        const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
        return (sId === selectedId || tId === selectedId) ? '#ea580c' : '#e2e8f0';
      })
      .attr('stroke-width', d => {
        const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
        return (sId === selectedId || tId === selectedId) ? 2.5 : 1.2;
      });
  }, [selectedId]);

  // Zoom control operations
  const triggerZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(
      zoomBehaviorRef.current.scaleBy as any, 1.25
    );
  };

  const triggerZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(
      zoomBehaviorRef.current.scaleBy as any, 0.8
    );
  };

  const triggerFit = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const w = containerRef.current.clientWidth;
    d3.select(svgRef.current).transition().duration(350).call(
      zoomBehaviorRef.current.transform as any,
      d3.zoomIdentity.translate(w / 2, 200).scale(0.9)
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 lg:py-16 pt-24 px-8 lg:px-12 min-h-screen">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-5xl font-black tracking-tight text-gray-950 font-sans">
          Contributors
        </h1>
      </header>

      {/* Main split dashboard section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
        
        {/* Dynamic Force Graph Panel */}
        <div 
          ref={containerRef}
          id="contributor-graph-container"
          className="lg:col-span-7 xl:col-span-8 min-h-[400px] border border-gray-100/90 rounded-3xl relative overflow-hidden bg-gray-50/40 shadow-inner flex flex-col justify-between"
        >
          {/* Header watermark indicators */}
          <div className="absolute top-4 left-4 pointer-events-none z-10 flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono uppercase">
              NETWORK GRAPH
            </span>
          </div>

          <svg 
            ref={svgRef} 
            className="w-full h-[400px] block select-none"
          />

          {/* Floating Zoom & Fit toolbox */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 p-1.5 gap-1">
            <button 
              onClick={triggerZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={triggerZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-100 mx-0.5" />
            <button 
              onClick={triggerFit}
              title="Fit Graph"
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Contributor details card */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div>
                {/* Header Profile Badge */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-black text-lg bg-orange-50 border border-orange-100/50 text-orange-600 overflow-hidden">
                      {selectedAuthor.avatarUrl ? (
                        <img src={selectedAuthor.avatarUrl} alt={selectedAuthor.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        selectedAuthor.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-950 font-sans tracking-tight">
                        {selectedAuthor.name}
                      </h3>
                      <p className="text-xs font-semibold uppercase font-mono tracking-widest text-orange-600">
                        {selectedAuthor.title}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role and Specialty tags row */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-slate-500 font-mono">
                    <Award className="w-3 h-3 text-slate-400" />
                    Role: {selectedAuthor.role || 'author'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-gray-50 border border-gray-100 text-gray-500 font-mono">
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    Focus: {selectedAuthor.specialty}
                  </span>
                </div>

                {/* Biography text - raw without unrequested wrapping quote characters */}
                <div className="border-t border-gray-50 pt-5">
                  <p className="text-gray-500 text-base leading-relaxed font-serif italic mb-6">
                    {selectedAuthor.bio}
                  </p>
                </div>
              </div>

              {/* Contributor Social Contacts channels */}
              {selectedAuthor.socialLinks && (
                <div className="pt-6 border-t border-gray-50 flex items-center gap-3">
                  {selectedAuthor.socialLinks.twitter && (
                    <a 
                      href={`https://twitter.com/${selectedAuthor.socialLinks.twitter}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-50 hover:bg-orange-50/50 hover:text-orange-600 text-gray-400 rounded-xl transition-all border border-gray-100/30"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {selectedAuthor.socialLinks.github && (
                    <a 
                      href={`https://github.com/${selectedAuthor.socialLinks.github}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-50 hover:bg-orange-50/50 hover:text-orange-600 text-gray-400 rounded-xl transition-all border border-gray-100/30"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {selectedAuthor.socialLinks.email && (
                    <a 
                      href={`mailto:${selectedAuthor.socialLinks.email}`}
                      className="p-2 bg-gray-50 hover:bg-orange-50/50 hover:text-orange-600 text-gray-400 rounded-xl transition-all border border-gray-100/30"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Bottom Horizontal Listed Related Posts section, styled full width like Archives */}
      <section className="w-full border-t border-gray-50 pt-12">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-5 h-5 text-orange-600" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight font-sans">
            Related Notes to {selectedAuthor.name}
          </h2>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-gray-50 rounded-xl" />
            <div className="h-28 bg-gray-50 rounded-xl" />
          </div>
        ) : relatedPosts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-gray-50/30 border border-dashed border-gray-100">
            <p className="text-gray-400 font-medium italic">
              No matching notes related to this contributor in indices.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {relatedPosts.map((post, index) => (
              <PostCard 
                key={post.slug} 
                post={post} 
                index={index} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

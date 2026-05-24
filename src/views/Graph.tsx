import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { Search, ZoomIn, ZoomOut, Maximize2, Settings2 } from 'lucide-react';
import { safeFetch } from '../utils/api';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  tags: string[];
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function Graph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [filter, setFilter] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [strength, setStrength] = useState(-200);
  const navigate = useNavigate();

  useEffect(() => {
    safeFetch<GraphData>('/api/graph')
      .then(setData)
      .catch(err => console.error("Could not load graph:", err));
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Initial zoom
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));

    // Simulation forces
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(strength))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(60));

    // Arrowhead for directed graph
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#e5e7eb')
      .style('stroke', 'none');

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        navigate(`/post/${d.id}`);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Node circles
    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => {
        const matches = filter && (
          d.title.toLowerCase().includes(filter.toLowerCase()) || 
          d.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()))
        );
        return matches ? '#ea580c' : '#94a3b8';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-300');

    // Node labels
    if (showLabels) {
      node.append('text')
        .attr('x', 12)
        .attr('y', 4)
        .text(d => d.title)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', '#64748b')
        .attr('class', 'pointer-events-none uppercase tracking-tighter');
    }

    // Hover effect
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('circle').transition().attr('r', 12).attr('fill', '#ea580c');
      d3.select(this).select('text').transition().attr('font-size', '12px').attr('fill', '#0f172a');
      
      // Highlight incident links
      link.transition()
        .attr('stroke', l => (l.source === d || l.target === d) ? '#ea580c' : '#e5e7eb')
        .attr('stroke-opacity', l => (l.source === d || l.target === d) ? 1 : 0.2);
    }).on('mouseleave', function(event, d) {
      const matches = filter && (
        d.title.toLowerCase().includes(filter.toLowerCase()) || 
        d.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()))
      );
      d3.select(this).select('circle').transition().attr('r', 8).attr('fill', matches ? '#ea580c' : '#94a3b8');
      d3.select(this).select('text').transition().attr('font-size', '10px').attr('fill', '#64748b');
      link.transition().attr('stroke', '#e5e7eb').attr('stroke-opacity', 0.6);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, navigate, filter, showLabels, strength]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
      zoomRef.current.scaleBy(svg.transition().duration(300), 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
      zoomRef.current.scaleBy(svg.transition().duration(300), 0.75);
    }
  };

  const handleReset = () => {
    if (svgRef.current && containerRef.current && zoomRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
      const transform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
      zoomRef.current.transform(svg.transition().duration(500), transform);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fdfdfc]">
      <header className="p-8 pb-4">
        <h1 className="text-4xl font-black tracking-tighter mb-2">Knowledge Graph</h1>
        <p className="text-gray-400 font-medium">Explore the interconnected nexus of research notes.</p>
      </header>

      <div className="flex-1 relative" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full" />

        {/* Floating Controls */}
        <div className="absolute top-4 left-8 right-8 flex flex-wrap gap-4 items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-xl border border-gray-100 shadow-sm pointer-events-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Find node or tag..."
                className="pl-9 pr-4 py-2 w-48 text-sm bg-transparent outline-none font-medium text-gray-700"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-xl border border-gray-100 shadow-sm">
              <button 
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-orange-600 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-orange-600 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                onClick={handleReset}
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-orange-600 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-xl border border-gray-100 shadow-sm group relative">
              <button 
                className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-orange-600 transition-all"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-xl p-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all origin-top-right z-50">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Simulation Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex justify-between text-[11px] font-bold text-gray-600 mb-2">
                      <span>Node Labels</span>
                      <input 
                        type="checkbox" 
                        checked={showLabels}
                        onChange={(e) => setShowLabels(e.target.checked)}
                      />
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex justify-between text-[11px] font-bold text-gray-600 mb-2">
                      <span>Force Strength</span>
                      <span className="text-orange-600">{strength}</span>
                    </label>
                    <input 
                      type="range" 
                      min="-1000" 
                      max="-10" 
                      step="10"
                      className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      value={strength}
                      onChange={(e) => setStrength(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[11px] font-bold text-gray-600">Research Note</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-600" />
              <span className="text-[11px] font-bold text-gray-600">Active / Highlighted</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-[9px] text-gray-400 font-medium max-w-[120px]">Edges indicate references or citations between notes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

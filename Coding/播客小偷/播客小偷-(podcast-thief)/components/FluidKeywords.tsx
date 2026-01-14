import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Keyword } from '../types';

interface FluidKeywordsProps {
  keywords: Keyword[];
}

const FluidKeywords: React.FC<FluidKeywordsProps> = ({ keywords }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!keywords || keywords.length === 0 || !svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = width; // Keep it square
    const radius = width / 2;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    svg.selectAll("*").remove(); // Clear previous

    // Prepare data with initial positions
    const nodes = keywords.map((d) => ({
      ...d,
      r: 20 + d.weight * 40, // Radius based on weight
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
    }));

    // Draw the "Turntable" background
    svg.append("circle")
      .attr("r", radius - 5)
      .attr("fill", "rgba(255, 255, 255, 0.03)")
      .attr("stroke", "rgba(124, 58, 237, 0.3)")
      .attr("stroke-width", 2);
    
    // Decorative rings
    svg.append("circle")
      .attr("r", radius * 0.7)
      .attr("fill", "none")
      .attr("stroke", "rgba(124, 58, 237, 0.1)")
      .attr("stroke-dasharray", "10, 10")
      .attr("stroke-width", 1);

    // Node groups
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node");

    // Bubbles
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => {
        const opacity = 0.2 + (d.weight * 0.5);
        return `rgba(139, 92, 246, ${opacity})`; // Violet palette
      })
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 1);

    // Text
    node.append("text")
      .text(d => d.word)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "#fff")
      .attr("font-size", d => Math.max(10, d.r / 2.5))
      .attr("font-weight", "500")
      .style("pointer-events", "none");

    // Simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("charge", d3.forceManyBody().strength(5)) // Slight repulsion
      .force("collide", d3.forceCollide().radius((d: any) => d.r + 2).iterations(2))
      .force("center", d3.forceCenter(0, 0)) // Pull to center
      .force("radial", d3.forceRadial(radius / 3, 0, 0).strength(0.1)) // Keep within a band
      .alphaDecay(0.005) // Slow decay for "fluid" continuous movement
      .velocityDecay(0.4) // High friction for "viscous" feel
      .on("tick", () => {
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

    // Add gentle continuous turbulence
    const interval = setInterval(() => {
      simulation.alpha(0.1).restart();
    }, 2000);

    return () => {
      simulation.stop();
      clearInterval(interval);
    };
  }, [keywords]);

  return (
    <div ref={wrapperRef} className="w-full relative aspect-square max-w-md mx-auto">
      {/* The rotating container */}
      <div className="w-full h-full animate-spin-slow">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      </div>
      {/* Static overlay center if needed, currently plain */}
    </div>
  );
};

export default FluidKeywords;

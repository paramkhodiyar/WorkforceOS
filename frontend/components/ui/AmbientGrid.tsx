'use client';

import React, { useEffect, useRef } from 'react';

export function AmbientGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gridSize = 64; // 4rem matching CSS grids
    
    interface GridNode {
      x: number;
      y: number;
      pulseOpacity: number;
      pulseSpeed: number;
      direction: number;
    }

    const nodes: GridNode[] = [];
    
    interface Packet {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
    }

    const packets: Packet[] = [];

    const initNodes = () => {
      nodes.length = 0;
      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);
      
      for (let c = 1; c < cols; c++) {
        for (let r = 1; r < rows; r++) {
          if (Math.random() < 0.2) {
            nodes.push({
              x: c * gridSize,
              y: r * gridSize,
              pulseOpacity: 0.1 + Math.random() * 0.4,
              pulseSpeed: 0.003 + Math.random() * 0.006,
              direction: Math.random() > 0.5 ? 1 : -1,
            });
          }
        }
      }
    };

    initNodes();

    const spawnPacket = () => {
      if (packets.length >= 6) return;
      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);

      if (cols <= 2 || rows <= 2) return;

      const startCol = Math.floor(Math.random() * (cols - 1)) + 1;
      const startRow = Math.floor(Math.random() * (rows - 1)) + 1;

      const isHorizontal = Math.random() > 0.5;
      const distance = Math.random() > 0.5 ? 1 : -1;

      const targetCol = isHorizontal ? Math.max(1, Math.min(cols - 1, startCol + distance * 2)) : startCol;
      const targetRow = !isHorizontal ? Math.max(1, Math.min(rows - 1, startRow + distance * 2)) : startRow;

      packets.push({
        x: startCol * gridSize,
        y: startRow * gridSize,
        targetX: targetCol * gridSize,
        targetY: targetRow * gridSize,
        progress: 0,
        speed: 0.004 + Math.random() * 0.008,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      
      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);

      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * gridSize, 0);
        ctx.lineTo(c * gridSize, height);
        ctx.stroke();
      }

      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * gridSize);
        ctx.lineTo(width, r * gridSize);
        ctx.stroke();
      }

      // Draw ambient pulsing nodes
      nodes.forEach((node) => {
        node.pulseOpacity += node.pulseSpeed * node.direction;
        if (node.pulseOpacity >= 0.7) {
          node.direction = -1;
        } else if (node.pulseOpacity <= 0.1) {
          node.direction = 1;
        }

        ctx.fillStyle = `rgba(37, 99, 235, ${node.pulseOpacity * 0.22})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw traveling packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          if (Math.random() < 0.3) {
            nodes.push({
              x: p.targetX,
              y: p.targetY,
              pulseOpacity: 0.7,
              pulseSpeed: 0.015,
              direction: -1,
            });
          }
          packets.splice(i, 1);
          continue;
        }

        const currX = p.x + (p.targetX - p.x) * p.progress;
        const currY = p.y + (p.targetY - p.y) * p.progress;

        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(currX, currY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(currX, currY);
        ctx.stroke();
      }

      if (Math.random() < 0.012) {
        spawnPacket();
      }

      if (nodes.length > 60) {
        nodes.splice(30, nodes.length - 60);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
}

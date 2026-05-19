import { useEffect, useRef } from 'react';

export const SOFT_COLORS = ['#F6A0AC', '#A1C3E7', '#908DCE', '#E47C9C', '#D99BD8'];

export default function PieChart({ data, width = 200, height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8;

    ctx.clearRect(0, 0, width, height);

    let startAngle = -Math.PI / 2;
    for (let i = 0; i < data.length; i++) {
      const angle = (data[i].count / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      ctx.beginPath();
      ctx.fillStyle = SOFT_COLORS[i % SOFT_COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fill();
      startAngle = endAngle;
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: `${width}px`, height: `${height}px`, display: 'block' }} />;
}
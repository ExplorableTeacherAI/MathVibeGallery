import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
  subtitle?: string;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  height = 150,
  showValues = true,
  className = ""
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const colors = [
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(34, 197, 94, 0.8)',    // green
    'rgba(251, 191, 36, 0.8)',   // yellow
    'rgba(239, 68, 68, 0.8)',    // red
    'rgba(147, 51, 234, 0.8)',   // purple
    'rgba(236, 72, 153, 0.8)',   // pink
    'rgba(99, 102, 241, 0.8)',   // indigo
    'rgba(249, 115, 22, 0.8)',   // orange
    'rgba(20, 184, 166, 0.8)',   // teal
    'rgba(6, 182, 212, 0.8)'     // cyan
  ];

  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(251, 191, 36, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(147, 51, 234, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(99, 102, 241, 1)',
    'rgba(249, 115, 22, 1)',
    'rgba(20, 184, 166, 1)',
    'rgba(6, 182, 212, 1)'
  ];

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Count',
        data: data.map(item => item.value),
        backgroundColor: data.map((_, index) => colors[index % colors.length]),
        borderColor: data.map((_, index) => borderColors[index % borderColors.length]),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function (context: any) {
            return context[0].label;
          },
          label: function (context: any) {
            return `Count: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          stepSize: 1,
        },
      },
    },
    elements: {
      bar: {
        borderWidth: 1,
      },
    },
  };

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </div>
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
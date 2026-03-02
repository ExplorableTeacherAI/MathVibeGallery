import React, { useRef, useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface YearData {
  year: number;
  count: number;
}

interface RangeSliderWithHistogramProps {
  data: YearData[];
  value: [number, number] | null;
  onChange: (range: [number, number] | null) => void;
  onClear: () => void;
}

export const RangeSliderWithHistogram: React.FC<RangeSliderWithHistogramProps> = ({
  data,
  value,
  onChange,
  onClear,
}) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSlider, setActiveSlider] = useState<'start' | 'end' | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [dragType, setDragType] = useState<'start' | 'end' | 'range' | null>(null);

  const minYear = data.length > 0 ? Math.min(...data.map(d => d.year)) : 2020;
  const maxYear = data.length > 0 ? Math.max(...data.map(d => d.year)) : 2024;
  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 1;

  const currentRange = value || [minYear, maxYear];

  // Create chart data with enhanced highlighting
  const chartData = {
    labels: data.map(d => d.year.toString()),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: data.map((d, index) => {
          const year = d.year;
          const [start, end] = currentRange;
          
          if (year >= start && year <= end) {
            // Gradient effect for selected bars - darker for higher values
            const intensity = d.count / maxCount;
            const baseOpacity = 0.7 + (intensity * 0.3);
            return `rgba(239, 68, 68, ${baseOpacity})`; // Red with variable opacity
          }
          // Grayed out bars outside selection
          return 'rgba(156, 163, 175, 0.3)'; // Light gray with low opacity
        }),
        borderColor: data.map((d, index) => {
          const year = d.year;
          const [start, end] = currentRange;
          
          if (year >= start && year <= end) {
            return 'rgba(239, 68, 68, 0.8)'; // Red border for selected
          }
          return 'rgba(156, 163, 175, 0.5)'; // Gray border for unselected
        }),
        borderWidth: 1,
        barThickness: 'flex' as const,
        maxBarThickness: 6,
        categoryPercentage: 0.9,
        barPercentage: 0.7,
        borderRadius: {
          topLeft: 2,
          topRight: 2,
          bottomLeft: 0,
          bottomRight: 0,
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeInOutQuart' as const,
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 10,
        bottom: 25,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(239, 68, 68, 0.8)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return `Year ${context[0].label}`;
          },
          label: function(context: any) {
            return `Count: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#6B7280',
          font: {
            size: 10,
          },
          padding: 0,
        },
        border: {
          display: true,
          color: '#E5E7EB',
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      bar: {
        borderWidth: 0,
        borderRadius: 0,
        borderSkipped: false,
      },
    },
    interaction: {
      intersect: false,
    },
  };

  // Handle range slider input changes with enhanced interaction
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseInt(e.target.value);
    const end = currentRange[1];
    if (newStart <= end) {
      onChange([newStart, end]);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseInt(e.target.value);
    const start = currentRange[0];
    if (newEnd >= start) {
      onChange([start, newEnd]);
    }
  };

  // Enhanced interaction handlers
  const handleSliderMouseDown = (type: 'start' | 'end') => {
    setIsDragging(true);
    setActiveSlider(type);
  };

  const handleSliderMouseUp = () => {
    setIsDragging(false);
    setActiveSlider(null);
  };

  const handleSliderMouseEnter = () => {
    setIsHovering(true);
  };

  const handleSliderMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className="w-full space-y-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Histogram with Overlaid Slider */}
      <div className="relative h-36 w-full bg-gray-50 rounded-lg border border-gray-100 p-2">
        <Bar ref={chartRef} data={chartData} options={chartOptions} />
        
        {/* Range Sliders Container - Overlaid on chart */}
        <div 
          className="absolute bottom-0 left-0 right-0 px-2 pb-2"
          onMouseEnter={handleSliderMouseEnter}
          onMouseLeave={handleSliderMouseLeave}
        >
          {/* Slider Track Container */}
          <div className="relative h-6 mb-0">
            {/* Track background */}
            <div className={`absolute w-full h-2 rounded-full top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
              isHovering ? 'bg-gray-300' : 'bg-gray-200'
            }`}></div>
            
            {/* Selected range highlight */}
            <div 
              className={`absolute h-2 rounded-full top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                isDragging ? 'bg-red-500' : 'bg-red-400'
              } ${isHovering ? 'shadow-sm' : ''}`}
              style={{
                left: `${((currentRange[0] - minYear) / (maxYear - minYear)) * 100}%`,
                width: `${((currentRange[1] - currentRange[0]) / (maxYear - minYear)) * 100}%`
              }}
            ></div>
            
            {/* Range Sliders */}
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={currentRange[0]}
              onChange={handleStartChange}
              onMouseDown={() => handleSliderMouseDown('start')}
              onMouseUp={handleSliderMouseUp}
              onTouchStart={() => handleSliderMouseDown('start')}
              onTouchEnd={handleSliderMouseUp}
              className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer range-slider z-10"
            />
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={currentRange[1]}
              onChange={handleEndChange}
              onMouseDown={() => handleSliderMouseDown('end')}
              onMouseUp={handleSliderMouseUp}
              onTouchStart={() => handleSliderMouseDown('end')}
              onTouchEnd={handleSliderMouseUp}
              className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer range-slider z-10"
            />
            
            {/* Range indicators */}
            <div 
              className={`absolute rounded-full border-2 border-white top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-200 ${
                activeSlider === 'start' || (isHovering && !isDragging) 
                  ? 'w-4 h-4 bg-red-600 shadow-lg' 
                  : 'w-3 h-3 bg-red-500 shadow-md'
              }`}
              style={{
                left: `${((currentRange[0] - minYear) / (maxYear - minYear)) * 100}%`
              }}
            ></div>
            <div 
              className={`absolute rounded-full border-2 border-white top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-200 ${
                activeSlider === 'end' || (isHovering && !isDragging) 
                  ? 'w-4 h-4 bg-red-600 shadow-lg' 
                  : 'w-3 h-3 bg-red-500 shadow-md'
              }`}
              style={{
                left: `${((currentRange[1] - minYear) / (maxYear - minYear)) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Year Labels */}
      <div className="flex justify-between text-xs font-medium text-gray-600 mb-3 mx-6">
        <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{minYear}</span>
        <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{maxYear}</span>
      </div>
      
      {/* Selected Range Display */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          <span className="text-sm font-semibold text-red-700">
            {currentRange[0]} - {currentRange[1]}
          </span>
          <span className="text-xs text-red-500 font-medium">
            ({currentRange[1] - currentRange[0] + 1} years)
          </span>
        </div>
      </div>

      {/* Clear Button */}
      {value && (
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="w-full text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 h-8 font-medium transition-colors duration-200"
          >
            Clear year filter
          </Button>
        </div>
      )}
    </div>
  );
};
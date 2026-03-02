import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import './SimpleRangeSlider.css';

interface YearData {
  year: number;
  count: number;
}

interface SimpleRangeSliderProps {
  data: YearData[];
  value: [number, number] | null;
  onChange: (range: [number, number] | null) => void;
  onClear: () => void;
}

export const SimpleRangeSlider: React.FC<SimpleRangeSliderProps> = ({
  data,
  value,
  onChange,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeSlider, setActiveSlider] = useState<'start' | 'end' | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const minYear = data.length > 0 ? Math.min(...data.map(d => d.year)) : 2020;
  const maxYear = data.length > 0 ? Math.max(...data.map(d => d.year)) : 2024;

  const currentRange = value || [minYear, maxYear];

  // Generate year markers for x-axis
  const generateYearMarkers = () => {
    const yearSpan = maxYear - minYear;
    const markers = [];
    
    // Show all years if span is small (≤ 10 years), otherwise show every 2-3 years
    const step = yearSpan <= 10 ? 1 : Math.ceil(yearSpan / 5);
    
    for (let year = minYear; year <= maxYear; year += step) {
      markers.push(year);
    }
    
    // Always include the max year if it's not already included
    if (markers[markers.length - 1] !== maxYear) {
      markers.push(maxYear);
    }
    
    return markers;
  };

  const yearMarkers = generateYearMarkers();

  // Handle range slider input changes
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

  // Interaction handlers
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
    <div className="w-full">
      {/* Range Slider Container */}
      <div 
        className="relative px-2 py-4"
        onMouseEnter={handleSliderMouseEnter}
        onMouseLeave={handleSliderMouseLeave}
      >
        {/* Slider Track Container */}
        <div className="relative h-6 mb-8">
          {/* Track background */}
          <div className={`absolute w-full h-2 rounded-full top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
            isHovering ? 'bg-gray-300' : 'bg-gray-200'
          }`}></div>
          
          {/* Selected range highlight */}
          <div 
            className={`absolute h-2 rounded-full top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
              isDragging ? 'bg-blue-500' : 'bg-blue-400'
            } ${isHovering ? 'shadow-sm' : ''}`}
            style={{
              left: `${((currentRange[0] - minYear) / (maxYear - minYear)) * 100}%`,
              width: `${((currentRange[1] - currentRange[0]) / (maxYear - minYear)) * 100}%`
            }}
          ></div>
          
          {/* Range Sliders - Hidden native thumbs */}
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
            className="absolute w-full h-6 bg-transparent cursor-pointer z-10"
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              background: 'transparent',
              outline: 'none'
            }}
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
            className="absolute w-full h-6 bg-transparent cursor-pointer z-10"
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              background: 'transparent',
              outline: 'none'
            }}
          />
          
          {/* Custom Range indicators */}
          <div 
            className={`absolute rounded-full border-2 border-white top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-200 pointer-events-none ${
              activeSlider === 'start' || (isHovering && !isDragging) 
                ? 'w-4 h-4 bg-blue-600 shadow-lg' 
                : 'w-3 h-3 bg-blue-500 shadow-md'
            }`}
            style={{
              left: `${((currentRange[0] - minYear) / (maxYear - minYear)) * 100}%`
            }}
          ></div>
          <div 
            className={`absolute rounded-full border-2 border-white top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-200 pointer-events-none ${
              activeSlider === 'end' || (isHovering && !isDragging) 
                ? 'w-4 h-4 bg-blue-600 shadow-lg' 
                : 'w-3 h-3 bg-blue-500 shadow-md'
            }`}
            style={{
              left: `${((currentRange[1] - minYear) / (maxYear - minYear)) * 100}%`
            }}
          ></div>

          {/* Value labels above thumbs */}
          <div 
            className="absolute text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded shadow-sm border border-blue-200 transform -translate-x-1/2 -translate-y-full z-30"
            style={{
              left: `${((currentRange[0] - minYear) / (maxYear - minYear)) * 100}%`,
              top: '-8px'
            }}
          >
            {currentRange[0]}
          </div>
          <div 
            className="absolute text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded shadow-sm border border-blue-200 transform -translate-x-1/2 -translate-y-full z-30"
            style={{
              left: `${((currentRange[1] - minYear) / (maxYear - minYear)) * 100}%`,
              top: '-8px'
            }}
          >
            {currentRange[1]}
          </div>

          {/* X-axis Year Markers - positioned relative to the slider track */}
          <div className="absolute w-full" style={{ top: '20px' }}>
            {yearMarkers.map((year) => (
              <div
                key={year}
                className="absolute transform -translate-x-1/2"
                style={{
                  left: `${((year - minYear) / (maxYear - minYear)) * 100}%`
                }}
              >
                {/* Tick mark */}
                <div className="w-px h-2 bg-gray-400 mx-auto mb-1"></div>
                {/* Year label */}
                <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
                  {year}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Button */}
      {value && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-8 font-medium transition-colors duration-200"
          >
            Clear year filter
          </Button>
        </div>
      )}
    </div>
  );
};
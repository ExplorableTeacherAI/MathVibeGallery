import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteOption {
  id: string;
  name: string;
  description?: string;
  color?: string | null;
}

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  filterFunction?: (options: AutocompleteOption[], searchValue: string) => AutocompleteOption[];
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  noOptionsMessage?: string;
  maxHeight?: string;
  useColors?: boolean;
}

const defaultFilterFunction = (options: AutocompleteOption[], searchValue: string) => {
  if (!searchValue.trim()) return [];
  return options.filter(option =>
    option.name.toLowerCase().includes(searchValue.toLowerCase())
  );
};

const defaultRenderOption = (option: AutocompleteOption) => (
  <div>
    <div 
      className="font-semibold text-gray-800"
    >
      {option.name}
    </div>
    {option.description && (
      <div className="text-sm text-gray-600">{option.description}</div>
    )}
  </div>
);

export const AutocompleteInput = ({
  id,
  value,
  onChange,
  onSelect,
  options,
  placeholder = "Type to search...",
  required = false,
  className = "",
  disabled = false,
  filterFunction = defaultFilterFunction,
  renderOption = defaultRenderOption,
  noOptionsMessage = "No options found",
  maxHeight = "max-h-40",
  useColors = true
}: AutocompleteInputProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Filter options based on input value
  useEffect(() => {
    if (value.trim() === "" && isFocused) {
      // Show all options when input is empty but focused
      setFilteredOptions(options);
      setShowDropdown(options.length > 0);
    } else {
      // Filter options when there's input text
      const filtered = filterFunction(options, value);
      setFilteredOptions(filtered);
      setShowDropdown(filtered.length > 0 && isFocused);
    }
  }, [value, options, filterFunction, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option.name);
    setShowDropdown(false);
    if (onSelect) {
      onSelect(option);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for option clicks
    setTimeout(() => {
      setShowDropdown(false);
      setIsFocused(false);
    }, 150);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // The useEffect will handle showing the dropdown based on the new isFocused state
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      
      {showDropdown && filteredOptions.length > 0 && (
        <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg ${maxHeight} overflow-y-auto`}>
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
              style={useColors ? { 
                backgroundColor: `${option.color || '#6366f1'}40`,
                borderLeft: `4px solid ${option.color || '#6366f1'}`
              } : {}}
              onClick={() => handleOptionClick(option)}
            >
              {renderOption(option)}
            </div>
          ))}
        </div>
      )}
      
      {isFocused && filteredOptions.length === 0 && value.trim() !== "" && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">
            {noOptionsMessage}
          </div>
        </div>
      )}
    </div>
  );
};
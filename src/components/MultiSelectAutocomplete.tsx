import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  description?: string;
  category?: string;
  categoryColor?: string | null;
}

interface MultiSelectAutocompleteProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  maxHeight?: string;
}

export const MultiSelectAutocomplete: React.FC<MultiSelectAutocompleteProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Search and select...",
  disabled = false,
  className,
  required = false,
  maxHeight = "200px"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Filter options based on search value
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    (option.category && option.category.toLowerCase().includes(searchValue.toLowerCase())) ||
    (option.description && option.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Get selected option objects for display
  const selectedOptions = options.filter(option => selectedValues.includes(option.id));

  const handleOptionSelect = (optionId: string) => {
    const newSelectedValues = selectedValues.includes(optionId)
      ? selectedValues.filter(id => id !== optionId)
      : [...selectedValues, optionId];
    
    onChange(newSelectedValues);
    setSearchValue("");
    setHighlightedIndex(-1);
  };

  const handleOptionRemove = (optionId: string) => {
    const newSelectedValues = selectedValues.filter(id => id !== optionId);
    onChange(newSelectedValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex].id);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchValue("");
        break;
      case "Backspace":
        if (searchValue === "" && selectedValues.length > 0) {
          // Remove last selected option when backspace is pressed and input is empty
          const lastOptionId = selectedValues[selectedValues.length - 1];
          handleOptionRemove(lastOptionId);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        aria-required={required}
        className="w-full justify-between min-h-10 h-auto p-2"
        disabled={disabled}
        onClick={handleToggle}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <Badge
                  key={option.id}
                  variant="secondary"
                  className="text-sm font-semibold border-none"
                  style={{
                    backgroundColor: `${option.categoryColor || '#6366f1'}2b`,
                    color: option.categoryColor || '#6366f1',
                  }}
              >
                {option.label}
                <div
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleOptionRemove(option.id);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionRemove(option.id);
                  }}
                >
                  <X className="h-3 w-3 opacity-70 hover:opacity-100" style={{ color: '#1f2937' }} />
                </div>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="flex items-center border-b px-3">
            <Input
              ref={inputRef}
              placeholder="Search..."
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
          
          <div 
            ref={optionsRef}
            className="max-h-60 overflow-auto p-1"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.id);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center justify-between transition-colors rounded-md mx-1 my-0.5 hover:opacity-80",
                      isHighlighted && "ring-2 ring-accent"
                    )}
                    style={{
                      backgroundColor: `${option.categoryColor || '#6366f1'}2b`
                    }}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <div className="flex flex-col flex-1">
                      <span 
                        className="font-medium"
                        style={{ color: option.categoryColor || '#6366f1' }}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 ml-2" style={{ color: option.categoryColor || '#6366f1' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
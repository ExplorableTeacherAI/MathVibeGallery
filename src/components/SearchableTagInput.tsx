import React from "react";
import { MultiSelectAutocomplete } from "./MultiSelectAutocomplete";

interface Tag {
  id: string;
  tag_name: string;
  description?: string;
  categories?: {
    name: string;
    color?: string | null;
  };
}

interface SearchableTagInputProps {
  tags: Tag[];
  selectedTags: string[];
  onTagChange: (tagIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableTagInput: React.FC<SearchableTagInputProps> = ({
  tags,
  selectedTags,
  onTagChange,
  placeholder = "Search and select tags...",
  disabled = false,
  className
}) => {
  // Transform tags to options format for MultiSelectAutocomplete
  const options = tags.map(tag => ({
    id: tag.id,
    label: tag.tag_name,
    description: tag.description,
    category: tag.categories?.name,
    categoryColor: tag.categories?.color
  }));

  return (
    <MultiSelectAutocomplete
      options={options}
      selectedValues={selectedTags}
      onChange={onTagChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};
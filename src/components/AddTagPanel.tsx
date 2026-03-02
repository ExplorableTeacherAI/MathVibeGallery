import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { useToast } from "@/hooks/use-toast";
import { CategoryModal } from "./CategoryModal";

interface Category {
  id: string;
  name: string;
  description: string;
  color?: string | null;
}

interface AddTagPanelProps {
  categories: Category[];
  onTagAdded: (tag: any) => void;
  onClose: () => void;
}

export const AddTagPanel = ({ categories, onTagAdded, onClose }: AddTagPanelProps) => {
  const [tagName, setTagName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleCategoryAdded = (category: Category) => {
    // Auto-select the newly created category
    setSelectedCategoryName(category.name);
    
    // Notify parent to refresh categories
    onTagAdded(null); // This will trigger refresh in parent
  };

  const handleSubmit = async () => {
    
    // Validation
    if (!tagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please select a category for the tag.",
        variant: "destructive",
      });
      return;
    }

    // Find the category ID from the name
    const selectedCategory = categories.find(cat => cat.name === selectedCategoryName.trim());
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Selected category not found. Please select a valid category.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if tag already exists in this category
      const { data: existingTag, error: checkError } = await supabase
        .from('tags')
        .select('id')
        .eq('tag_name', tagName.trim())
        .eq('category_id', selectedCategory.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking existing tag:', checkError);
        toast({
          title: "Error",
          description: "Failed to check for existing tags. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (existingTag) {
        toast({
          title: "Error",
          description: "A tag with this name already exists in the selected category.",
          variant: "destructive",
        });
        return;
      }

      const tagData = {
        tag_name: tagName.trim(),
        category_id: selectedCategory.id,
        description: description.trim() || null, // Include description, null if empty
      };

      const { data, error } = await supabase
        .from('tags')
        .insert([tagData])
        .select(`
          *,
          categories (*)
        `)
        .single();

      if (error) {
        console.error('Error inserting tag:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add tag. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Tag added successfully!",
      });

      // Clear form
      setTagName("");
      setDescription("");
      setSelectedCategoryName("");

      // Notify parent component
      onTagAdded(data);
      onClose();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tag-name">Tag Name *</Label>
        <Input
          id="tag-name"
          type="text"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="Enter tag name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag-description">Description</Label>
        <Textarea
          id="tag-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for this tag (optional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="tag-category">Category *</Label>
          <CategoryModal onCategoryAdded={handleCategoryAdded} triggerVariant="outline" />
        </div>
        <AutocompleteInput
          value={selectedCategoryName}
          onChange={setSelectedCategoryName}
          options={categories}
          placeholder="Type to search or select a category..."
          onSelect={(category) => setSelectedCategoryName(category.name)}
          required
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-black hover:bg-gray-800 text-white">
          {isSubmitting ? "Adding..." : "Add Tag"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
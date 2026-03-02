import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface AddCategoryPanelProps {
  onCategoryAdded: (category: Category) => void;
  onClose: () => void;
}

export const AddCategoryPanel = ({ onCategoryAdded, onClose }: AddCategoryPanelProps) => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validation
    if (!categoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if category already exists
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking existing category:', checkError);
        toast({
          title: "Error",
          description: "Failed to check for existing categories. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (existingCategory) {
        toast({
          title: "Error",
          description: "A category with this name already exists.",
          variant: "destructive",
        });
        return;
      }

      const categoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
        color: color,
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting category:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add category. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Category added successfully!",
      });

      // Clear form
      setCategoryName("");
      setCategoryDescription("");
      setColor("#6366f1");

      // Notify parent component
      onCategoryAdded(data);
      onClose();
    } catch (error) {
      console.error("Error adding category:", error);
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
        <Label htmlFor="category-name">Category Name *</Label>
        <Input
          id="category-name"
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Enter category name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          value={categoryDescription}
          onChange={(e) => setCategoryDescription(e.target.value)}
          placeholder="Enter category description (optional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="category-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366f1"
            className="font-mono"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Category"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
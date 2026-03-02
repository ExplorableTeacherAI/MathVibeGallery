import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SubjectArea {
  id: string;
  name: string;
  description: string;
}

interface AddSubjectAreaPanelProps {
  onSubjectAreaAdded: (subjectArea: SubjectArea) => void;
  onClose: () => void;
}

export const AddSubjectAreaPanel = ({ onSubjectAreaAdded, onClose }: AddSubjectAreaPanelProps) => {
  const [subjectAreaName, setSubjectAreaName] = useState("");
  const [subjectAreaDescription, setSubjectAreaDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validation
    if (!subjectAreaName.trim()) {
      toast({
        title: "Error",
        description: "Subject area name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if subject area already exists
      const { data: existingSubjectArea, error: checkError } = await supabase
        .from("subject_area")
        .select("id")
        .eq("name", subjectAreaName.trim())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingSubjectArea) {
        toast({
          title: "Error",
          description: "A subject area with this name already exists",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create new subject area
      const { data, error } = await supabase
        .from("subject_area")
        .insert([
          {
            name: subjectAreaName.trim(),
            description: subjectAreaDescription.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject area added successfully",
      });

      // Call the callback with the new subject area
      onSubjectAreaAdded(data);

      // Reset form
      setSubjectAreaName("");
      setSubjectAreaDescription("");
    } catch (error) {
      console.error("Error adding subject area:", error);
      toast({
        title: "Error",
        description: "Failed to add subject area. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject-area-name">Subject Area Name *</Label>
        <Input
          id="subject-area-name"
          type="text"
          value={subjectAreaName}
          onChange={(e) => setSubjectAreaName(e.target.value)}
          placeholder="Enter subject area name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject-area-description">Description</Label>
        <Textarea
          id="subject-area-description"
          value={subjectAreaDescription}
          onChange={(e) => setSubjectAreaDescription(e.target.value)}
          placeholder="Enter subject area description (optional)"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting} variant="outline" className="flex-1">
          {isSubmitting ? "Adding..." : "Add Subject Area"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
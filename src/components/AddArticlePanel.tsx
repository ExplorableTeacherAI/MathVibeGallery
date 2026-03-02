import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { Plus } from "lucide-react";

interface Article {
  id: string;
  title: string;
  link: string;
  year: number | null;
  subject: string;
  subject_area_id: string;
  subject_area?: {
    name: string;
  };
}

interface AddArticlePanelProps {
  onArticleAdded: (article: any) => void;
  onClose: () => void;
  article?: Article; // Optional article for editing
}

export const AddArticlePanel = ({ onArticleAdded, onClose, article }: AddArticlePanelProps) => {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [subjectArea, setSubjectArea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject area management
  const [existingSubjectAreas, setExistingSubjectAreas] = useState<Array<{ id: string, name: string, description: string }>>([]);
  const [subjectAreaInput, setSubjectAreaInput] = useState<string>("");
  const [newSubjectAreaName, setNewSubjectAreaName] = useState("");
  const [newSubjectAreaDescription, setNewSubjectAreaDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();

  // Fetch existing subject areas on component mount
  useEffect(() => {
    fetchSubjectAreas();
  }, []);

  // Initialize form fields when editing an article
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setLink(article.link);
      setYear(article.year !== null ? article.year.toString() : "");
      setSubject(article.subject);
      setSubjectAreaInput(article.subject_area?.name || "");
    }
  }, [article]);

  const fetchSubjectAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("subject_area")
        .select("id, name, description")
        .order("name");

      if (error) throw error;
      setExistingSubjectAreas(data || []);
    } catch (error) {
      console.error("Error fetching subject areas:", error);
    }
  };



  const handleCreateNewSubjectArea = async () => {
    if (!newSubjectAreaName.trim()) {
      toast({
        title: "Error",
        description: "Subject area name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subject_area')
        .insert([
          {
            name: newSubjectAreaName.trim(),
            description: newSubjectAreaDescription.trim()
          }
        ])
        .select('id, name, description')
        .single();

      if (error) throw error;

      // Update the existing subject areas list
      setExistingSubjectAreas(prev => [...prev, data]);

      // Set the newly created subject area as input
      setSubjectAreaInput(data.name);

      // Reset form and close dialog
      setNewSubjectAreaName("");
      setNewSubjectAreaDescription("");
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Subject area created successfully",
      });
    } catch (error) {
      console.error('Error creating subject area:', error);
      toast({
        title: "Error",
        description: "Failed to create subject area",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!link.trim()) {
      toast({
        title: "Error",
        description: "Link is required",
        variant: "destructive",
      });
      return;
    }

    // Year is optional, but if provided must be a valid number
    if (year.trim() && isNaN(Number(year))) {
      toast({
        title: "Error",
        description: "Year must be a valid number",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Error",
        description: "Subject is required",
        variant: "destructive",
      });
      return;
    }

    if (!subjectAreaInput.trim()) {
      toast({
        title: "Error",
        description: "Subject area is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find or create subject area
      let subjectAreaId: string;
      const existingArea = existingSubjectAreas.find(area =>
        area.name.toLowerCase() === subjectAreaInput.trim().toLowerCase()
      );

      if (existingArea) {
        subjectAreaId = existingArea.id;
      } else {
        // Create new subject area
        const { data: newAreaData, error: areaError } = await supabase
          .from('subject_area')
          .insert([
            {
              name: subjectAreaInput.trim(),
              description: ""
            }
          ])
          .select('id, name, description')
          .single();

        if (areaError) throw areaError;

        subjectAreaId = newAreaData.id;
        setExistingSubjectAreas(prev => [...prev, newAreaData]);
      }

      // Create or update the article
      let data, error;

      if (article) {
        // Update existing article
        const result = await supabase
          .from("articles")
          .update({
            title: title.trim(),
            link: link.trim(),
            year: year.trim() ? parseInt(year) : null,
            subject: subject.trim(),
            subject_area_id: subjectAreaId,
          })
          .eq('id', article.id)
          .select()
          .single();

        data = result.data;
        error = result.error;
      } else {
        // Create new article
        const result = await supabase
          .from("articles")
          .insert([
            {
              title: title.trim(),
              link: link.trim(),
              year: year.trim() ? parseInt(year) : null,
              subject: subject.trim(),
              subject_area_id: subjectAreaId,
            },
          ])
          .select()
          .single();

        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: article ? "Article updated successfully" : "Article added successfully",
      });

      // Reset form only if adding new article
      if (!article) {
        setTitle("");
        setSubject("");
        setYear("");
        setLink("");
        setSubjectAreaInput("");
      }

      // Notify parent component
      onArticleAdded(data);
    } catch (error) {
      console.error(article ? "Error updating article:" : "Error adding article:", error);
      toast({
        title: "Error",
        description: article ? "Failed to update article" : "Failed to add article",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="article-title">Title *</Label>
          <Input
            id="article-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-link">Link *</Label>
          <Input
            id="article-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/article"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="article-year">Year (Optional)</Label>
            <Input
              id="article-year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              min="1900"
              max="2100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-subject">Subject</Label>
            <Input
              id="article-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Optional subject"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="subjectArea">Subject Area *</Label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Subject Area
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Subject Area</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-subject-area-name">Name *</Label>
                    <Input
                      id="new-subject-area-name"
                      type="text"
                      value={newSubjectAreaName}
                      onChange={(e) => setNewSubjectAreaName(e.target.value)}
                      placeholder="e.g., Algebra, Geometry, Probability"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-subject-area-description">Description (Optional)</Label>
                    <Textarea
                      id="new-subject-area-description"
                      value={newSubjectAreaDescription}
                      onChange={(e) => setNewSubjectAreaDescription(e.target.value)}
                      placeholder="Brief description of this subject area"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateNewSubjectArea}
                      className="flex-1"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <AutocompleteInput
            value={subjectAreaInput}
            onChange={setSubjectAreaInput}
            options={existingSubjectAreas}
            placeholder="Type to search or enter new subject area..."
            onSelect={(option) => setSubjectAreaInput(option.name)}
            required
            useColors={false}
            renderOption={(option) => (
              <div className="font-semibold text-gray-800">
                {option.name}
              </div>
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting
              ? (article ? "Updating..." : "Adding...")
              : (article ? "Update Article" : "Add Article")
            }
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
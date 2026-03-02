import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Link } from "lucide-react";
import { TagModal } from "./TagModal";
import { SearchableTagInput } from "./SearchableTagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  tag_name: string;
  description?: string;
  category_id?: string;
  categories?: {
    name: string;
    color?: string | null;
  };
}

interface ImageWithTagsProps {
  index: number;
  onRemove: (index: number) => void;
  onChange: (index: number, data: { file?: File; url?: string; tags: string[] }) => void;
  initialData?: {
    file?: File;
    url?: string;
    tags: string[];
  };
}

export const ImageWithTags: React.FC<ImageWithTagsProps> = ({
  index,
  onRemove,
  onChange,
  initialData
}) => {
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(initialData?.file || null);
  const [imageUrl, setImageUrl] = useState(initialData?.url || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Use ref to track if we're updating from initialData to prevent circular updates
  const isUpdatingFromInitialData = useRef(false);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    // Only notify parent if we're not updating from initialData
    if (!isUpdatingFromInitialData.current) {
      onChange(index, {
        file: selectedFile || undefined,
        url: imageUrl || undefined,
        tags: selectedTags
      });
    }
  }, [selectedFile, imageUrl, selectedTags, index]);

  // Reset component state when initialData changes (e.g., after form submission)
  useEffect(() => {
    isUpdatingFromInitialData.current = true;
    
    setSelectedFile(initialData?.file || null);
    setImageUrl(initialData?.url || "");
    setSelectedTags(initialData?.tags || []);
    
    // Reset flag after state updates
    setTimeout(() => {
      isUpdatingFromInitialData.current = false;
    }, 0);
  }, [initialData]);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .select(`
          id,
          tag_name,
          description,
          category_id,
          categories (
            name,
            color
          )
        `)
        .order("tag_name");

      if (error) throw error;
      setTags(data as any || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tags",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(""); // Clear URL when file is selected
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setImageUrl(url);
    if (url) {
      setSelectedFile(null); // Clear file when URL is entered
    }
  };

  const handleTagChange = (tagIds: string[]) => {
    setSelectedTags(tagIds);
  };

  const refreshTags = () => {
    fetchTags();
  };

  const getImagePreview = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return imageUrl;
  };

  const isVideoFile = (file: File | null, url: string) => {
    if (file) {
      return file.type.startsWith('video/');
    }
    if (url) {
      // Check common video file extensions
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
      return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    }
    return false;
  };

  const hasImage = selectedFile || imageUrl;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Media File {index + 1}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Method Selection */}
        <div className="flex space-x-4">
          <Button
            type="button"
            variant={uploadMethod === "file" ? "default" : "outline"}
            onClick={() => setUploadMethod("file")}
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </Button>
          <Button
            type="button"
            variant={uploadMethod === "url" ? "default" : "outline"}
            onClick={() => setUploadMethod("url")}
            className="flex items-center space-x-2"
          >
            <Link className="w-4 h-4" />
            <span>Image URL</span>
          </Button>
        </div>

        {/* File Upload */}
        {uploadMethod === "file" && (
          <div className="space-y-2">
            <Label htmlFor={`image-file-${index}`}>Select Image, GIF, or Video</Label>
            <Input
              id={`image-file-${index}`}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
        )}

        {/* URL Input */}
        {uploadMethod === "url" && (
          <div className="space-y-2">
            <Label htmlFor={`image-url-${index}`}>Image or Video URL</Label>
            <Input
              id={`image-url-${index}`}
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={handleUrlChange}
            />
          </div>
        )}

        {/* Media Preview */}
        {hasImage && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-2">
              {isVideoFile(selectedFile, imageUrl) ? (
                <video
                  src={getImagePreview()}
                  className="max-w-full h-32 object-contain mx-auto"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <img
                  src={getImagePreview()}
                  alt="Preview"
                  className="max-w-full h-32 object-contain mx-auto"
                />
              )}
            </div>
          </div>
        )}

        {/* Tag Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Tags</Label>
            <TagModal 
              onTagAdded={refreshTags}
              triggerText="Add Tag"
              triggerVariant="outline"
            />
          </div>
          
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading tags...</div>
          ) : (
            <SearchableTagInput
              tags={tags}
              selectedTags={selectedTags}
              onTagChange={handleTagChange}
              placeholder="Search and select tags..."
              disabled={isLoading}
            />
          )}
          
          {!isLoading && tags.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No tags available. Create some tags first.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
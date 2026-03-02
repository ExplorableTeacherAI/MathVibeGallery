import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { SearchableTagInput } from "./SearchableTagInput";
import { X, Save, Loader2, Link, Image as ImageIcon, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Article {
  id: string;
  title: string;
  link: string;
  year: number;
  subject: string;
  subject_area: {
    id: string;
    name: string;
  } | null;
}

interface ImageTag {
  tag: {
    id: string;
    tag_name: string;
    category: {
      id: string;
      name: string;
    } | null;
  };
}

interface Image {
  id: string;
  image_url: string;
  created_at: string;
  article: Article | null;
  image_tags: ImageTag[];
}

interface Tag {
  id: string;
  tag_name: string;
  categories?: {
    name: string;
    color?: string | null;
  };
}

interface EditImagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  image: Image | null;
  onImageUpdated: (updatedImage: Image) => void;
}

export const EditImagePanel: React.FC<EditImagePanelProps> = ({
  isOpen,
  onClose,
  image,
  onImageUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Image upload states
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();

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

  useEffect(() => {
    if (isOpen) {
      fetchArticles();
      fetchTags();
    }
  }, [isOpen]);

  useEffect(() => {
    if (image) {
      setSelectedArticleId(image.article?.id || "");
      setSelectedTagIds(image.image_tags.map(it => it.tag.id));
      setImageUrl(image.image_url);
      setSelectedFile(null);
    }
  }, [image]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          year,
          subject,
          link,
          subject_area:subject_area (
            id,
            name
          )
        `)
        .order("title");

      if (error) throw error;
      setArticles(data as any || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to load articles",
        variant: "destructive",
      });
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select(`
          id,
          tag_name,
          categories:categories (
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
        description: "Failed to load tags",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(""); // Clear URL when file is selected
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setSelectedFile(null); // Clear file when URL is entered
  };

  const getImagePreview = () => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    return imageUrl;
  };

  const handleSave = async () => {
    if (!image) return;

    try {
      setSaving(true);
      setUploading(true);

      let finalImageUrl = imageUrl;

      // If a new file is selected, upload it first
      if (selectedFile) {
        finalImageUrl = await uploadFile(selectedFile);
      }

      // Update image with new URL and article association
      const { error: imageError } = await supabase
        .from("images")
        .update({ 
          image_url: finalImageUrl,
          article_id: selectedArticleId || null 
        })
        .eq("id", image.id);

      if (imageError) throw imageError;

      // Delete existing image tags
      const { error: deleteTagsError } = await supabase
        .from("image_tags")
        .delete()
        .eq("image_id", image.id);

      if (deleteTagsError) throw deleteTagsError;

      // Insert new image tags
      if (selectedTagIds.length > 0) {
        const imageTags = selectedTagIds.map(tagId => ({
          image_id: image.id,
          tag_id: tagId
        }));

        const { error: insertTagsError } = await supabase
          .from("image_tags")
          .insert(imageTags);

        if (insertTagsError) throw insertTagsError;
      }

      // Fetch updated image data
      const { data: updatedImageData, error: fetchError } = await supabase
        .from("images")
        .select(`
          id,
          image_url,
          created_at,
          article:articles (
            id,
            title,
            year,
            subject,
            link,
            subject_area:subject_area (
              id,
              name
            )
          ),
          image_tags (
            tag:tags (
              id,
              tag_name,
              category:categories (
                id,
                name
              )
            )
          )
        `)
        .eq("id", image.id)
        .single();

      if (fetchError) throw fetchError;

      onImageUpdated(updatedImageData as any);
      onClose();

      toast({
        title: "Success",
        description: "Image details updated successfully",
      });
    } catch (error) {
      console.error("Error updating image:", error);
      toast({
        title: "Error",
        description: "Failed to update image details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[140px] sm:!w-[300px] lg:!w-[380px] xl:!w-[460px] !max-w-none flex flex-col overflow-hidden">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Edit Image Details</SheetTitle>
          <SheetDescription className="text-base">
            Update the article association and tags for this image.
          </SheetDescription>
        </SheetHeader>

        {image && (
          <div className="flex-1 mt-2 overflow-hidden">
            <div className="h-full w-full overflow-auto">
              <div className="space-y-6 pr-4 pl-1 pb-4">
              {/* Image Upload Section */}
              <div className="space-y-4">
                    <Label className="text-base font-semibold">Image</Label>
                    
                    {/* Upload Method Selection */}
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={uploadMethod === "file" ? "default" : "outline"}
                        onClick={() => setUploadMethod("file")}
                        className="flex items-center space-x-2"
                        size="sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload File</span>
                      </Button>
                      <Button
                        type="button"
                        variant={uploadMethod === "url" ? "default" : "outline"}
                        onClick={() => setUploadMethod("url")}
                        className="flex items-center space-x-2"
                        size="sm"
                      >
                        <Link className="w-4 h-4" />
                        <span>Image URL</span>
                      </Button>
                    </div>

                    {/* File Upload */}
                    {uploadMethod === "file" && (
                      <div className="space-y-2">
                        <Label htmlFor="image-file">Select New Media File</Label>
                        <Input
                          id="image-file"
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
                        <Label htmlFor="image-url">Media File URL</Label>
                        <Input
                          id="image-url"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrl}
                          onChange={handleUrlChange}
                        />
                      </div>
                    )}

                    {/* Media Preview */}
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted/50">
                        {isVideoFile(selectedFile, imageUrl) ? (
                          <video
                            src={getImagePreview()}
                            className="w-full h-full object-contain"
                            autoPlay
                            loop
                            muted
                            controls
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.poster = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <img
                            src={getImagePreview()}
                            alt="Media preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

              <Separator />

              {/* Article Association */}
              <div className="space-y-4">
                    <Label htmlFor="article" className="text-base font-semibold">Associated Article</Label>
                    <Select value={selectedArticleId || "none"} onValueChange={(value) => setSelectedArticleId(value === "none" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an article (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No article</SelectItem>
                        {articles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{article.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {article.year} • {article.subject_area?.name || article.subject}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedArticle && (
                      <div className="p-4 bg-muted/50 rounded-lg border">
                        <p className="text-sm font-medium">{selectedArticle.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedArticle.year} • {selectedArticle.subject_area?.name || selectedArticle.subject}
                        </p>
                        {selectedArticle.link && (
                          <a 
                            href={selectedArticle.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                          >
                            View Article
                          </a>
                        )}
                      </div>
                    )}
                  </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-4">
                    <Label className="text-base font-semibold">Tags</Label>
                    <SearchableTagInput
                      tags={tags}
                      selectedTags={selectedTagIds}
                      onTagChange={setSelectedTagIds}
                      placeholder="Search and select tags..."
                    />
                    
                    {selectedTagIds.length > 0 && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-8 pb-6 px-1">
                <Button 
                  onClick={handleSave} 
                  disabled={saving || uploading}
                  className="flex-1"
                  size="lg"
                >
                  {saving || uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploading ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={saving || uploading}
                  size="lg"
                  className="w-24"
                >
                  Cancel
                </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
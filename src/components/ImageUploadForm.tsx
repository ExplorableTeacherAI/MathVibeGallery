import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { useToast } from "@/hooks/use-toast";
import { ArticleModal } from "./ArticleModal";
import { MultiImageUpload } from "./MultiImageUpload";

interface Article {
  id: string;
  title: string;
  link: string;
  year: number;
  subject: string;
  subject_area_id: string | null;
}

interface ImageData {
  file?: File;
  url?: string;
  tags: string[];
}

export const ImageUploadForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArticleTitle, setSelectedArticleTitle] = useState<string>("");
  const [images, setImages] = useState<ImageData[]>([]);
  
  // Data from database
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const articlesResponse = await supabase.from("articles").select("*");

      if (articlesResponse.error) throw articlesResponse.error;

      setArticles(articlesResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshArticles = async () => {
    const articlesResponse = await supabase.from("articles").select("*");
    if (articlesResponse.data) {
      setArticles(articlesResponse.data);
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

  const getArticleIdFromTitle = (title: string) => {
    const article = articles.find(a => a.title === title);
    return article?.id || "";
  };

  const handleArticleSelect = (value: string) => {
    setSelectedArticleTitle(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedArticleId = getArticleIdFromTitle(selectedArticleTitle);
    if (!selectedArticleId) {
      toast({
        title: "Error",
        description: "Please select an article for the images.",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty images (images without file or URL)
    const validImages = images.filter(img => img.file || img.url);
    
    if (validImages.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one image with a file or URL before uploading",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadPromises = images.map(async (imageData) => {
        // Skip empty images
        if (!imageData.file && !imageData.url) {
          return null;
        }

        let finalImageUrl = imageData.url || "";
        
        // If a file is selected, upload it first
        if (imageData.file) {
          finalImageUrl = await uploadFile(imageData.file);
        }

        // Insert image data
        const imageInsertData = {
          image_url: finalImageUrl,
          article_id: selectedArticleId,
        };

        const { data: insertedImage, error: imageError } = await supabase
          .from('images')
          .insert([imageInsertData])
          .select()
          .single();

        if (imageError) {
          throw imageError;
        }

        // Insert image-tag relationships
        if (imageData.tags.length > 0) {
          const imageTagData = imageData.tags.map(tagId => ({
            image_id: insertedImage.id,
            tag_id: tagId,
          }));

          const { error: tagError } = await supabase
            .from('image_tags')
            .insert(imageTagData);

          if (tagError) {
            console.error('Error inserting image tags:', tagError);
            // Don't throw here, just log the error
          }
        }

        return insertedImage;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);

      toast({
        title: "Success",
        description: `${successfulUploads.length} image(s) uploaded successfully!`,
      });

      // Reset form
      setSelectedArticleTitle("");
      setImages([]);
      
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImagesChange = (newImages: ImageData[]) => {
    setImages(newImages);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
        <p className="text-muted-foreground mt-2">
            Upload images, GIFs, and videos with tags related to articles
          </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Article Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="article">Select Article *</Label>
              <ArticleModal onArticleAdded={refreshArticles} triggerVariant="outline" />
            </div>
            <AutocompleteInput
                value={selectedArticleTitle}
                onChange={handleArticleSelect}
                options={articles.map(article => ({
                  id: article.id,
                  name: article.title,
                  description: `Year: ${article.year}`
                }))}
                placeholder="Search and select an article..."
                useColors={false}
              />
          </div>

          {/* Multi-Image Upload */}
          <MultiImageUpload 
            onChange={handleImagesChange}
            initialImages={images}
            maxImages={10}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Uploading..." : "Upload Images"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
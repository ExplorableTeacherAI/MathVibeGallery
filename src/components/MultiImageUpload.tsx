import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ImageWithTags } from "./ImageWithTags";

interface ImageData {
  file?: File;
  url?: string;
  tags: string[];
}

interface MultiImageUploadProps {
  onChange: (images: ImageData[]) => void;
  initialImages?: ImageData[];
  maxImages?: number;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onChange,
  initialImages = [],
  maxImages = 10
}) => {
  const [images, setImages] = useState<ImageData[]>(
    initialImages.length > 0 ? initialImages : [{ tags: [] }]
  );
  
  // Use ref to track if we're in the middle of updating from parent
  const isUpdatingFromParent = useRef(false);

  // Reset images when initialImages prop changes (e.g., after form submission)
  // Only update if initialImages is actually different and we're not in an update cycle
  useEffect(() => {
    const newImages = initialImages.length > 0 ? initialImages : [{ tags: [] }];
    
    // Only update if the images are actually different
    if (JSON.stringify(images) !== JSON.stringify(newImages)) {
      isUpdatingFromParent.current = true;
      setImages(newImages);
      
      // Reset flag after state update
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [initialImages]);

  // Notify parent when images change (but not when updating from parent)
  useEffect(() => {
    if (!isUpdatingFromParent.current) {
      onChange(images);
    }
  }, [images, onChange]);

  const handleImageChange = useCallback((index: number, data: ImageData) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = data;
      return newImages;
    });
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddImage = useCallback(() => {
    if (images.length < maxImages) {
      setImages(prev => [...prev, { tags: [] }]);
    }
  }, [images.length, maxImages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Media Files for Article</h3>
      </div>

      <div className="space-y-4">
        {images.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-muted-foreground mb-4">No media files added yet</p>
            <Button
              type="button"
              onClick={handleAddImage}
              variant="outline"
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Media File</span>
            </Button>
          </div>
        ) : (
          images.map((imageData, index) => (
            <ImageWithTags
              key={index}
              index={index}
              onRemove={handleRemoveImage}
              onChange={handleImageChange}
              initialData={imageData}
            />
          ))
        )}
      </div>

      {/* Add Media File button below the containers */}
      {images.length > 0 && images.length < maxImages && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleAddImage}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Media File</span>
          </Button>
        </div>
      )}

      {images.length >= maxImages && (
        <div className="text-sm text-muted-foreground text-center">
          Maximum of {maxImages} media files allowed
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        {images.length} of {maxImages} media files
      </div>
    </div>
  );
};
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar } from "lucide-react";

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
      color?: string | null;
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

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: Image | null;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  image,
}) => {
  if (!image) return null;

  const isVideoFile = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-semibold">
            {image.article?.title || "Media Viewer"}
          </DialogTitle>
        </DialogHeader>

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center bg-black/5 p-4">
          {isVideoFile(image.image_url) ? (
            <video
              src={image.image_url}
              className="max-w-full max-h-[60vh] object-contain"
              controls
              autoPlay={false}
              onError={(e) => {
                const target = e.target as HTMLVideoElement;
                target.poster = "/placeholder.svg";
              }}
            />
          ) : (
            <img
              src={image.image_url}
              alt={image.article?.title || "Gallery image"}
              className="max-w-full max-h-[60vh] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          )}
        </div>

        {/* Media Information */}
        <div className="p-4 pt-2 border-t bg-gray-50/50">
          <div className="space-y-3">
            {/* Article and Year Info */}
            {(image.article?.year || image.article?.subject_area) && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {image.article?.year && image.article?.subject_area
                    ? `${image.article.year} • ${image.article.subject_area.name}`
                    : image.article?.year
                      ? image.article.year
                      : image.article?.subject_area?.name
                  }
                </span>
                {image.article?.link && (
                  <a
                    href={image.article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-1 h-6 w-6 ml-2 rounded-md hover:bg-gray-200 transition-colors"
                    title="Open article link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}



            {/* Tags */}
            {image.image_tags && image.image_tags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700 mb-2 block">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {image.image_tags.map((imageTag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm px-2 py-1 font-medium border-none transition-colors"
                      style={{
                        backgroundColor: `${imageTag.tag.category?.color || '#6366f1'}80`,
                        color: '#333333',
                      }}
                      title={imageTag.tag.category?.name ? `Category: ${imageTag.tag.category.name}` : undefined}
                    >
                      {imageTag.tag.tag_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
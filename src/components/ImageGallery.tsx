import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, Edit, Trash2, Eye } from "lucide-react";
import { FilterState, GroupByOption } from "./FilterPanel";
import { EditImagePanel } from "./EditImagePanel";
import { MediaViewerModal } from "./MediaViewerModal";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy Image component with placeholder
interface LazyMediaProps {
  src: string;
  alt: string;
  isVideo: boolean;
  className?: string;
}

const LazyMedia: React.FC<LazyMediaProps> = ({ src, alt, isVideo, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (mediaRef.current) {
      observer.observe(mediaRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={mediaRef} className="relative w-full h-full">
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {/* Only render media when in view */}
      {isInView && (
        isVideo ? (
          <video
            src={src}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.poster = "/placeholder.svg";
              setIsLoaded(true);
            }}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
              setIsLoaded(true);
            }}
          />
        )
      )}
    </div>
  );
};

// Constants for pagination
const IMAGES_PER_PAGE = 20;

interface Article {
  id: string;
  title: string;
  link: string;
  year: number | null;
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

interface ImageGalleryProps {
  filters?: FilterState;
  onImageCountChange?: (count: number) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ filters, onImageCountChange }) => {
  const [allImages, setAllImages] = useState<Image[]>([]); // All fetched images
  const [displayedImages, setDisplayedImages] = useState<Image[]>([]); // Images currently rendered
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<Image | null>(null);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<Image | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isVideoFile = (url: string) => {
    // Check common video file extensions
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Group images based on the selected groupBy option
  const getGroupKeys = (image: Image, groupBy: GroupByOption): string[] => {
    switch (groupBy) {
      case 'year':
        return [image.article?.year !== null && image.article?.year !== undefined
          ? image.article.year.toString()
          : 'Unknown Year'];
      case 'subjectArea':
        return [image.article?.subject_area?.name || 'Unknown Subject Area'];
      case 'article':
        return [image.article?.title || 'No Article'];
      case 'category': {
        const categories = image.image_tags
          ?.map(it => it.tag?.category?.name)
          .filter((name): name is string => !!name);
        return categories && categories.length > 0 ? [...new Set(categories)] : ['Uncategorized'];
      }
      case 'tag': {
        const tags = image.image_tags
          ?.map(it => it.tag?.tag_name)
          .filter((name): name is string => !!name);
        return tags && tags.length > 0 ? tags : ['Untagged'];
      }
      default:
        return ['all'];
    }
  };

  const groupedImages = useMemo(() => {
    if (!filters?.groupBy || filters.groupBy === 'none') {
      return null; // No grouping
    }

    const groups: Record<string, Image[]> = {};

    displayedImages.forEach(image => {
      const keys = getGroupKeys(image, filters.groupBy);
      keys.forEach(key => {
        if (!groups[key]) {
          groups[key] = [];
        }
        // Avoid duplicates in the same group
        if (!groups[key].some(img => img.id === image.id)) {
          groups[key].push(image);
        }
      });
    });

    // Sort groups
    const sortedEntries = Object.entries(groups).sort((a, b) => {
      if (filters.groupBy === 'year') {
        // Sort years descending (newest first), Unknown at end
        if (a[0] === 'Unknown Year') return 1;
        if (b[0] === 'Unknown Year') return -1;
        return parseInt(b[0]) - parseInt(a[0]);
      }
      // Put unknown/uncategorized/untagged at end, otherwise alphabetical
      const unknownTerms = ['Unknown Subject Area', 'No Article', 'Uncategorized', 'Untagged'];
      if (unknownTerms.includes(a[0])) return 1;
      if (unknownTerms.includes(b[0])) return -1;
      return a[0].localeCompare(b[0]);
    });

    return sortedEntries;
  }, [displayedImages, filters?.groupBy]);

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setDisplayedImages([]);
    fetchImages();
  }, [filters]);

  // Update displayed images when allImages or page changes
  useEffect(() => {
    const endIndex = page * IMAGES_PER_PAGE;
    const newDisplayedImages = allImages.slice(0, endIndex);
    setDisplayedImages(newDisplayedImages);
    setHasMore(endIndex < allImages.length);
  }, [allImages, page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          setPage(prev => prev + 1);
          setLoadingMore(false);
        }
      },
      {
        rootMargin: "200px", // Start loading when 200px from the bottom
        threshold: 0.1,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  useEffect(() => {
    onImageCountChange?.(allImages.length);
  }, [allImages.length, onImageCountChange]);

  const fetchImages = async () => {
    try {
      setLoading(true);

      let query = supabase
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
                name,
                color
              )
            )
          )
        `)
        .order("created_at", { ascending: false });

      // Apply filters if provided
      if (filters) {
        // Article filter
        if (filters.articles.length > 0) {
          query = query.in("article_id", filters.articles);
        }

        // Subject area filter - need to filter by article's subject_area_id
        if (filters.subjectAreas.length > 0) {
          const { data: articlesInSubjectAreas } = await supabase
            .from("articles")
            .select("id")
            .in("subject_area_id", filters.subjectAreas);

          if (articlesInSubjectAreas) {
            const articleIds = articlesInSubjectAreas.map(a => a.id);
            if (articleIds.length > 0) {
              query = query.in("article_id", articleIds);
            } else {
              // No articles in selected subject areas, return empty result
              setAllImages([]);
              setLoading(false);
              return;
            }
          }
        }

        // Year filter
        if (filters.yearRange) {
          const { data: articlesInYearRange } = await supabase
            .from("articles")
            .select("id")
            .not('year', 'is', null)
            .gte("year", filters.yearRange[0])
            .lte("year", filters.yearRange[1])
            .order("year", { ascending: true });

          if (articlesInYearRange) {
            const articleIds = articlesInYearRange.map(a => a.id);
            if (articleIds.length > 0) {
              query = query.in("article_id", articleIds);
            } else {
              setAllImages([]);
              setLoading(false);
              return;
            }
          }
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let filteredImages = data || [];

      // Apply client-side filters for tags and categories (since they're in junction table)
      if (filters) {
        if (filters.tags.length > 0) {
          filteredImages = filteredImages.filter(image =>
            image.image_tags && image.image_tags.some((imageTag: any) =>
              imageTag.tag && filters.tags.includes(imageTag.tag.id)
            )
          );
        }

        if (filters.categories.length > 0) {
          filteredImages = filteredImages.filter(image =>
            image.image_tags && image.image_tags.some((imageTag: any) =>
              imageTag.tag && imageTag.tag.category && filters.categories.includes(imageTag.tag.category.id)
            )
          );
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredImages = filteredImages.filter((image: any) => {
            const articleTitle = Array.isArray(image.article)
              ? image.article[0]?.title?.toLowerCase() || ""
              : image.article?.title?.toLowerCase() || "";
            const articleSubject = Array.isArray(image.article)
              ? image.article[0]?.subject?.toLowerCase() || ""
              : image.article?.subject?.toLowerCase() || "";
            const subjectAreaName = Array.isArray(image.article)
              ? image.article[0]?.subject_area?.[0]?.name?.toLowerCase() || ""
              : image.article?.subject_area?.name?.toLowerCase() || "";
            const tagNames = image.image_tags?.map((it: any) => it.tag?.tag_name?.toLowerCase()).join(" ") || "";
            const categoryNames = image.image_tags?.map((it: any) => it.tag?.category?.name?.toLowerCase()).join(" ") || "";

            return articleTitle.includes(searchLower) ||
              articleSubject.includes(searchLower) ||
              subjectAreaName.includes(searchLower) ||
              tagNames.includes(searchLower) ||
              categoryNames.includes(searchLower);
          });
        }

        // Sort by year when year filter is applied
        if (filters.yearRange) {
          filteredImages.sort((a: any, b: any) => {
            const yearA = a.article?.year ?? -Infinity; // null years go to end
            const yearB = b.article?.year ?? -Infinity;
            return yearB - yearA; // descending (newest first)
          });
        }

        // Sort based on groupBy option for proper lazy loading order
        if (filters.groupBy && filters.groupBy !== 'none') {
          filteredImages.sort((a: any, b: any) => {
            switch (filters.groupBy) {
              case 'year': {
                const yearA = a.article?.year ?? -Infinity;
                const yearB = b.article?.year ?? -Infinity;
                return yearB - yearA; // descending (newest first)
              }
              case 'subjectArea': {
                const areaA = a.article?.subject_area?.name || 'zzz'; // unknown at end
                const areaB = b.article?.subject_area?.name || 'zzz';
                return areaA.localeCompare(areaB); // alphabetical
              }
              case 'article': {
                const titleA = a.article?.title || 'zzz'; // no article at end
                const titleB = b.article?.title || 'zzz';
                return titleA.localeCompare(titleB); // alphabetical
              }
              case 'category': {
                const catA = a.image_tags?.[0]?.tag?.category?.name || 'zzz';
                const catB = b.image_tags?.[0]?.tag?.category?.name || 'zzz';
                return catA.localeCompare(catB); // alphabetical
              }
              case 'tag': {
                const tagA = a.image_tags?.[0]?.tag?.tag_name || 'zzz';
                const tagB = b.image_tags?.[0]?.tag?.tag_name || 'zzz';
                return tagA.localeCompare(tagB); // alphabetical
              }
              default:
                return 0;
            }
          });
        }
      }

      setAllImages(filteredImages as any);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to load images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      // First delete the image tags (foreign key constraints)
      const { error: tagsError } = await supabase
        .from("image_tags")
        .delete()
        .eq("image_id", imageId);

      if (tagsError) {
        throw tagsError;
      }

      // Then delete the image itself
      const { error: imageError } = await supabase
        .from("images")
        .delete()
        .eq("id", imageId);

      if (imageError) {
        throw imageError;
      }

      // Update the local state to remove the deleted image
      setAllImages(prevImages => prevImages.filter(img => img.id !== imageId));

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditImage = (image: Image) => {
    setSelectedImageForEdit(image);
    setEditPanelOpen(true);
  };

  const handleCloseEditPanel = () => {
    setEditPanelOpen(false);
    setSelectedImageForEdit(null);
  };

  const handleImageUpdated = (updatedImage: Image) => {
    setAllImages(prevImages =>
      prevImages.map(img =>
        img.id === updatedImage.id ? updatedImage : img
      )
    );
  };

  const handleViewImage = (image: Image) => {
    setSelectedImageForViewer(image);
    setViewerModalOpen(true);
  };

  const handleCloseViewerModal = () => {
    setViewerModalOpen(false);
    setSelectedImageForViewer(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading images...</span>
      </div>
    );
  }

  if (allImages.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-2">No media files yet</h3>
        <p className="text-muted-foreground">
          Upload your first image, GIF, or video to get started!
        </p>
      </div>
    );
  }

  // Render a single image card
  const renderImageCard = (image: Image) => (
    <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] relative overflow-hidden group">
        <LazyMedia
          src={image.image_url}
          alt={image.article?.title || "Gallery image"}
          isVideo={isVideoFile(image.image_url)}
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
        />

        {/* Year and Area Overlay - Top Left */}
        {(image.article?.year || image.article?.subject_area) && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2 py-1 bg-gray-400 text-white border-none backdrop-blur-sm"
            >
              {image.article?.year && image.article?.subject_area
                ? `${image.article.year} : ${image.article.subject_area.name}`
                : image.article?.year
                  ? image.article.year
                  : image.article?.subject_area?.name
              }
            </Badge>
          </div>
        )}

        {/* Action Icons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-gray-100 hover:bg-blue-100 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewImage(image);
            }}
            title="View in popup"
          >
            <Eye className="h-3 w-3 text-gray-600 hover:text-blue-600" />
          </Button>

          {user && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-gray-100 hover:bg-red-100 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
                    handleDeleteImage(image.id);
                  }
                }}
                title="Delete image"
              >
                <Trash2 className="h-3 w-3 text-gray-600 hover:text-red-600" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditImage(image);
                }}
                title="Edit image"
              >
                <Edit className="h-3 w-3 text-gray-600" />
              </Button>
            </>
          )}

          {image.article?.link && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(image.article.link, '_blank', 'noopener,noreferrer');
              }}
              title="Open article link"
            >
              <ExternalLink className="h-3 w-3 text-gray-500 hover:text-primary" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-1">
        {/* Tags */}
        {image.image_tags && image.image_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.image_tags.slice(0, 3).map((imageTag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-sm px-1 py-0 font-medium border-none transition-colors"
                style={{
                  backgroundColor: `${imageTag.tag.category?.color || '#6366f1'}2b`,
                  color: imageTag.tag.category?.color || '#6366f1',
                }}
                title={imageTag.tag.category?.name ? `Category: ${imageTag.tag.category.name}` : undefined}
              >
                {imageTag.tag.tag_name}
              </Badge>
            ))}
            {image.image_tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1 py-0 bg-gray-100 text-gray-600">
                +{image.image_tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {groupedImages ? (
        // Grouped view
        <div className="space-y-6">
          {groupedImages.map(([groupName, images]) => (
            <div key={groupName}>
              {/* Group Header */}
              <div className="flex items-center gap-4 mb-3">
                <div className="h-px flex-1 bg-gray-300"></div>
                <h3 className="text-sm font-semibold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                  {groupName} ({images.length})
                </h3>
                <div className="h-px flex-1 bg-gray-300"></div>
              </div>
              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {images.map(renderImageCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Default flat view
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {displayedImages.map(renderImageCard)}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="w-full py-4 flex justify-center">
        {hasMore && !loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {!hasMore && displayedImages.length > 0 && (
          <p className="text-sm text-muted-foreground">All {allImages.length} items loaded</p>
        )}
      </div>

      <EditImagePanel
        isOpen={editPanelOpen}
        onClose={handleCloseEditPanel}
        image={selectedImageForEdit}
        onImageUpdated={handleImageUpdated}
      />

      <MediaViewerModal
        isOpen={viewerModalOpen}
        onClose={handleCloseViewerModal}
        image={selectedImageForViewer}
      />
    </>
  );
};
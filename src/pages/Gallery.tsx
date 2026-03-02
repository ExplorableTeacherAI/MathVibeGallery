import { useState } from "react";
import { ImageGallery } from "@/components/ImageGallery";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Filter, Menu } from "lucide-react";

export const Gallery = () => {
  const [filters, setFilters] = useState<FilterState>({
    articles: [],
    subjectAreas: [],
    tags: [],
    categories: [],
    yearRange: null,
    searchTerm: "",
    groupBy: "none",
  });

  const [imageCount, setImageCount] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden">
      {/* Filter Panel */}
      <div
        className={`fixed left-0 top-16 bottom-0 bg-white shadow-lg transition-transform duration-300 ease-in-out z-40 ${isPanelCollapsed ? '-translate-x-full' : 'translate-x-0'
          }`}
        style={{ width: '320px' }}
      >
        {/* Panel Content */}
        <div className="h-full overflow-y-auto">
          <FilterPanel
            onFiltersChange={setFilters}
            imageCount={imageCount}
            onHide={togglePanel}
          />
        </div>
      </div>

      {/* Show Panel Button - only visible when panel is collapsed */}
      {isPanelCollapsed && (
        <Button
          onClick={togglePanel}
          className="fixed top-20 left-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-md z-50 p-2"
          size="sm"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {!isPanelCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={togglePanel}
        />
      )}

      {/* Main Content */}
      <div
        className={`fixed top-16 bottom-0 right-0 transition-all duration-300 ease-in-out overflow-y-auto ${isPanelCollapsed ? 'left-0' : 'left-80'
          }`}
      >
        <div className="p-4">
          <ImageGallery
            filters={filters}
            onImageCountChange={setImageCount}
          />
        </div>
      </div>
    </div>
  );
};
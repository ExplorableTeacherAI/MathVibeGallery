import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { SimpleRangeSlider } from "./SimpleRangeSlider";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Search,
  FileText,
  Tag,
  Calendar,
  Target,
  FolderOpen
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  year: number | null;
  subject: string;
  subject_area: {
    id: string;
    name: string;
  } | null;
}

interface SubjectArea {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface TagWithCategory {
  id: string;
  tag_name: string;
  category: Category;
}

interface YearData {
  year: number;
  count: number;
}

export type GroupByOption = 'none' | 'year' | 'subjectArea' | 'article' | 'category' | 'tag';

export interface FilterState {
  articles: string[];
  subjectAreas: string[];
  tags: string[];
  categories: string[];
  yearRange: [number, number] | null;
  searchTerm: string;
  groupBy: GroupByOption;
}

interface FilterPanelProps {
  onFiltersChange: (filters: FilterState) => void;
  imageCount: number;
  onHide?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onFiltersChange, imageCount, onHide }) => {
  const [filters, setFilters] = useState<FilterState>({
    articles: [],
    subjectAreas: [],
    tags: [],
    categories: [],
    yearRange: null,
    searchTerm: "",
    groupBy: "none"
  });

  // Data states
  const [articles, setArticles] = useState<Article[]>([]);
  const [subjectAreas, setSubjectAreas] = useState<SubjectArea[]>([]);
  const [tags, setTags] = useState<TagWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [yearData, setYearData] = useState<YearData[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({
    articles: "",
    subjectAreas: "",
    tags: ""
  });

  // Collapsible states
  const [openSections, setOpenSections] = useState({
    articles: false,
    subjectAreas: false,
    tags: false,
    categories: false,
    years: false
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const fetchFilterData = async () => {
    try {
      setLoading(true);

      // Fetch articles with subject areas
      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select(`
          id,
          title,
          year,
          subject,
          subject_area:subject_area (
            id,
            name
          )
        `)
        .order("title");

      if (articlesError) throw articlesError;

      // Fetch subject areas
      const { data: subjectAreasData, error: subjectAreasError } = await supabase
        .from("subject_area")
        .select("id, name")
        .order("name");

      if (subjectAreasError) throw subjectAreasError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, color")
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch tags with categories
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select(`
          id,
          tag_name,
          category:categories (
            id,
            name,
            color
          )
        `)
        .order("tag_name") as any;

      if (tagsError) throw tagsError;

      // Fetch year distribution
      const { data: yearDistData, error: yearError } = await supabase
        .from("articles")
        .select("year")
        .order("year");

      if (yearError) throw yearError;

      // Process year data - filter out null years
      const yearCounts = yearDistData
        .filter((item) => item.year !== null)
        .reduce((acc: Record<number, number>, item) => {
          acc[item.year!] = (acc[item.year!] || 0) + 1;
          return acc;
        }, {});

      const processedYearData = Object.entries(yearCounts).map(([year, count]) => ({
        year: parseInt(year),
        count: count as number
      })).sort((a, b) => a.year - b.year);

      setArticles(articlesData as any || []);
      setSubjectAreas(subjectAreasData || []);
      setCategories(categoriesData || []);
      setTags(tagsData || []);
      setYearData(processedYearData);

    } catch (error) {
      console.error("Error fetching filter data:", error);
      toast({
        title: "Error",
        description: "Failed to load filter options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'articles' | 'subjectAreas' | 'tags' | 'categories', id: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(id)
      ? currentArray.filter(item => item !== id)
      : [...currentArray, id];
    updateFilters(key, newArray);
  };

  const clearAllFilters = () => {
    setFilters({
      articles: [],
      subjectAreas: [],
      tags: [],
      categories: [],
      yearRange: null,
      searchTerm: "",
      groupBy: "none"
    });
    setSearchTerms({ articles: "", subjectAreas: "", tags: "" });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveFiltersCount = () => {
    return filters.articles.length +
      filters.subjectAreas.length +
      filters.tags.length +
      filters.categories.length +
      (filters.yearRange ? 1 : 0) +
      (filters.searchTerm ? 1 : 0);
  };

  // Filter data based on search terms
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerms.articles.toLowerCase())
  );

  // Filter subject areas based on search terms
  const filteredSubjectAreas = subjectAreas.filter(area =>
    area.name.toLowerCase().includes(searchTerms.subjectAreas.toLowerCase())
  );

  // Filter tags based on selected categories and search terms
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.tag_name.toLowerCase().includes(searchTerms.tags.toLowerCase());
    const matchesCategory = filters.categories.length === 0 ||
      filters.categories.includes(tag.category.id);
    return matchesSearch && matchesCategory;
  });

  const maxYear = Math.max(...yearData.map(d => d.year));
  const minYear = Math.min(...yearData.map(d => d.year));
  const maxCount = Math.max(...yearData.map(d => d.count));

  if (loading) {
    return (
      <Card className="w-80 h-fit">
        <CardContent className="p-6">
          <div className="text-center">Loading filters...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header with Hide Button */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          {onHide && (
            <Button
              onClick={onHide}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 rounded-md"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {imageCount} images found
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Global Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters('searchTerm', e.target.value)}
              className="pl-10 h-8 text-sm border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Group By Dropdown */}
        <div className="p-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
          <select
            value={filters.groupBy}
            onChange={(e) => updateFilters('groupBy', e.target.value as GroupByOption)}
            className="w-full h-8 text-sm border border-gray-200 rounded-md px-3 bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="none">None</option>
            <option value="year">Year</option>
            <option value="subjectArea">Subject Area</option>
            <option value="article">Article</option>
            <option value="category">Category</option>
            <option value="tag">Tag</option>
          </select>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-1">
          {/* Articles Section */}
          <Collapsible open={openSections.articles} onOpenChange={(open) => toggleSection('articles')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Articles</span>
                </div>
                {openSections.articles ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-50/50">
              {/* Articles Search Bar */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerms.articles}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, articles: e.target.value }))}
                    className="pl-9 h-7 text-xs border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <div key={article.id} className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100">
                      <Checkbox
                        id={`article-${article.id}`}
                        checked={filters.articles.includes(article.id)}
                        onCheckedChange={(checked) => {
                          toggleArrayFilter('articles', article.id);
                        }}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`article-${article.id}`}
                        className="text-sm text-gray-600 cursor-pointer flex-1 leading-tight"
                      >
                        {article.title} {article.year !== null ? `(${article.year})` : ''}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center">
                    No articles found
                  </div>
                )}
              </div>
              {(filters.articles.length > 0 || searchTerms.articles) && (
                <div className="px-4 py-2 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateFilters('articles', []);
                      setSearchTerms(prev => ({ ...prev, articles: "" }));
                    }}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 h-7"
                  >
                    Clear selection & search
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Subject Areas Section */}
          <Collapsible open={openSections.subjectAreas} onOpenChange={(open) => toggleSection('subjectAreas')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Subject Areas</span>
                </div>
                {openSections.subjectAreas ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-50/50">
              {/* Subject Areas Search Bar */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search subject areas..."
                    value={searchTerms.subjectAreas}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, subjectAreas: e.target.value }))}
                    className="pl-9 h-7 text-xs border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredSubjectAreas.length > 0 ? (
                  filteredSubjectAreas.map((area) => (
                    <div key={area.id} className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100">
                      <Checkbox
                        id={`area-${area.id}`}
                        checked={filters.subjectAreas.includes(area.id)}
                        onCheckedChange={(checked) => {
                          toggleArrayFilter('subjectAreas', area.id);
                        }}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`area-${area.id}`}
                        className="text-sm text-gray-600 cursor-pointer flex-1"
                      >
                        {area.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center">
                    No subject areas found
                  </div>
                )}
              </div>
              {(filters.subjectAreas.length > 0 || searchTerms.subjectAreas) && (
                <div className="px-4 py-2 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateFilters('subjectAreas', []);
                      setSearchTerms(prev => ({ ...prev, subjectAreas: "" }));
                    }}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 h-7"
                  >
                    Clear selection & search
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Categories Section */}
          <Collapsible open={openSections.categories} onOpenChange={(open) => toggleSection('categories')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Categories</span>
                </div>
                {openSections.categories ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-50/50">
              <div className="max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.categories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        toggleArrayFilter('categories', category.id);
                      }}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm cursor-pointer flex-1 flex items-center"
                    >
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-sm"
                        style={{
                          backgroundColor: `${category.color || '#6366f1'}20`,
                          color: category.color || '#6366f1'
                        }}
                      >
                        {category.name}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              {filters.categories.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilters('categories', [])}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 h-7"
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Tags Section */}
          <Collapsible open={openSections.tags} onOpenChange={(open) => toggleSection('tags')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                </div>
                {openSections.tags ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-50/50">
              {/* Tags Search Bar */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tags..."
                    value={searchTerms.tags}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, tags: e.target.value }))}
                    className="pl-9 h-7 text-xs border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100"
                    >
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={filters.tags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          toggleArrayFilter('tags', tag.id);
                        }}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`tag-${tag.id}`}
                        className="text-sm cursor-pointer flex-1 flex items-center"
                      >
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-sm"
                          style={{
                            backgroundColor: `${tag.category.color || '#6366f1'}20`,
                            color: tag.category.color || '#6366f1'
                          }}
                        >
                          {tag.tag_name}
                        </span>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center">
                    No tags found
                  </div>
                )}
              </div>
              {(filters.tags.length > 0 || searchTerms.tags) && (
                <div className="px-4 py-2 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateFilters('tags', []);
                      setSearchTerms(prev => ({ ...prev, tags: "" }));
                    }}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 h-7"
                  >
                    Clear selection & search
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Years Section */}
          <Collapsible open={openSections.years} onOpenChange={(open) => toggleSection('years')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Years</span>
                </div>
                {openSections.years ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-50/50 p-4">
              <SimpleRangeSlider
                data={yearData}
                value={filters.yearRange}
                onChange={(range) => updateFilters('yearRange', range)}
                onClear={() => updateFilters('yearRange', null)}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Footer */}
      {getActiveFiltersCount() > 0 && (
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full text-sm text-gray-600 hover:text-gray-800 border-gray-200"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters ({getActiveFiltersCount()})
          </Button>
        </div>
      )}
    </div>
  );
};
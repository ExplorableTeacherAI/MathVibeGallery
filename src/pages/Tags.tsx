import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/SearchInput";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface Tag {
  id: string;
  tag_name: string;
  category_id: string;
  description?: string; // Add description field
  created_at: string;
  category?: Category;
}

type SortColumn = 'tag_name' | 'description' | 'category' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;

    const query = searchQuery.toLowerCase();
    return tags.filter(tag =>
      tag.tag_name.toLowerCase().includes(query) ||
      (tag.description && tag.description.toLowerCase().includes(query)) ||
      (tag.category?.name && tag.category.name.toLowerCase().includes(query))
    );
  }, [tags, searchQuery]);

  // Toggle sort column and direction
  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort filtered tags
  const sortedTags = useMemo(() => {
    if (!sortColumn) return filteredTags;

    return [...filteredTags].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortColumn) {
        case 'tag_name':
          valueA = a.tag_name.toLowerCase();
          valueB = b.tag_name.toLowerCase();
          break;
        case 'description':
          valueA = (a.description || '').toLowerCase();
          valueB = (b.description || '').toLowerCase();
          break;
        case 'category':
          valueA = (a.category?.name || '').toLowerCase();
          valueB = (b.category?.name || '').toLowerCase();
          break;
        case 'created_at':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTags, sortColumn, sortDirection]);


  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          *,
          category:categories (
            name,
            color
          )
        `)
        .order('tag_name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tags",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTag) {
        // Update existing tag
        const { error } = await supabase
          .from('tags')
          .update({
            tag_name: newTagName.trim(),
            category_id: selectedCategoryId,
            description: newTagDescription.trim() || null,
          })
          .eq('id', editingTag.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tag updated successfully",
        });
      } else {
        // Create new tag
        const { error } = await supabase
          .from('tags')
          .insert([{
            tag_name: newTagName.trim(),
            category_id: selectedCategoryId,
            description: newTagDescription.trim() || null,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Tag created successfully",
        });
      }

      // Reset form
      setNewTagName("");
      setNewTagDescription("");
      setSelectedCategoryId("");
      setEditingTag(null);
      setShowAddPanel(false);

      // Refresh the list
      fetchTags();
    } catch (error) {
      console.error('Error saving tag:', error);
      toast({
        title: "Error",
        description: "Failed to save tag",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.tag_name);
    setNewTagDescription(tag.description || "");
    setSelectedCategoryId(tag.category_id);
    setShowAddPanel(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTags(tags.filter(tag => tag.id !== id));
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setNewTagName("");
    setNewTagDescription("");
    setSelectedCategoryId("");
    setEditingTag(null);
    setShowAddPanel(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading tags...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage tags for features and concepts.
          </p>
          <div className="mt-4">
            <span className="text-lg font-medium text-blue-600">
              Total Tags: {tags.length}
            </span>
            {searchQuery && (
              <span className="ml-4 text-sm text-muted-foreground">
                ({filteredTags.length} filtered)
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setShowAddPanel(true)} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Tag
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tags by name, description, or category..."
          className="max-w-md"
        />
      </div>

      {showAddPanel && (
        <Card className="mb-8 bg-muted/50">
          <CardHeader>
            <CardTitle>{editingTag ? 'Edit Tag' : 'Add New Tag'}</CardTitle>
            <CardDescription>
              {editingTag ? 'Update the tag details' : 'Create a new tag for content organization'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagName">Tag Name *</Label>
                <Input
                  id="tagName"
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Drawing, Linking, Slider"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagDescription">Description</Label>
                <Textarea
                  id="tagDescription"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder="Enter a description for this tag (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `${category.color || '#6366f1'}40`,
                          borderLeft: `4px solid ${category.color || '#6366f1'}`
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-black text-white hover:bg-gray-800">
                  {isSubmitting ? (editingTag ? "Updating..." : "Creating...") : (editingTag ? "Update Tag" : "Create Tag")}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => toggleSort('tag_name')}
                >
                  <div className="flex items-center gap-1">
                    Tag Name
                    {sortColumn === 'tag_name' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => toggleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Description
                    {sortColumn === 'description' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => toggleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortColumn === 'category' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => toggleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    Created Date
                    {sortColumn === 'created_at' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading tags...
                  </TableCell>
                </TableRow>
              ) : sortedTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {searchQuery ? "No tags match your search" : "No tags found"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? "Try adjusting your search criteria" : "Get started by creating your first tag"}
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => setShowAddPanel(true)} className="flex items-center gap-2 mt-2">
                          <Plus className="h-4 w-4" />
                          Add Tag
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">
                      <Badge
                        variant="secondary"
                        className="text-sm px-2 py-1 font-medium border-none transition-colors"
                        style={{
                          backgroundColor: `${tag.category?.color || '#6366f1'}80`,
                          color: '#333333',
                        }}
                      >
                        {tag.tag_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {tag.description ? (
                        <span className="truncate block" title={tag.description}>
                          {tag.description}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/60">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-sm px-2 py-1 font-medium border-none transition-colors"
                        style={{
                          backgroundColor: `${tag.category?.color || '#6366f1'}80`,
                          color: '#333333',
                        }}
                      >
                        {tag.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tag.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
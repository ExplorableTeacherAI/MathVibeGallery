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
import { SearchInput } from "@/components/SearchInput";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color?: string | null;
  created_at: string;
}

type SortColumn = 'name' | 'color' | 'description' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query)) ||
      (category.color && category.color.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  // Toggle sort column and direction
  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort filtered categories
  const sortedCategories = useMemo(() => {
    if (!sortColumn) return filteredCategories;

    return [...filteredCategories].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortColumn) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'color':
          valueA = (a.color || '#6366f1').toLowerCase();
          valueB = (b.color || '#6366f1').toLowerCase();
          break;
        case 'description':
          valueA = (a.description || '').toLowerCase();
          valueB = (b.description || '').toLowerCase();
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
  }, [filteredCategories, sortColumn, sortDirection]);


  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            color: color,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: name.trim(),
            description: description.trim() || null,
            color: color,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      // Reset form
      setName("");
      setDescription("");
      setColor("#6366f1");
      setEditingCategory(null);
      setShowAddPanel(false);

      // Refresh the list
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setColor(category.color || "#6366f1");
    setShowAddPanel(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all associated tags.')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.filter(category => category.id !== id));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
    setEditingCategory(null);
    setShowAddPanel(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage tag categories for organizing content
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-lg font-semibold text-blue-600">
              Total Categories: {categories.length}
            </span>
            {searchQuery && (
              <span className="text-sm text-muted-foreground">
                ({filteredCategories.length} filtered)
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setShowAddPanel(true)} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>



      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search categories by name, description, or color..."
          className="max-w-md"
        />
      </div>

      {showAddPanel && (
        <Card className="mb-8 bg-muted/50">
          <CardHeader>
            <CardTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
            <CardDescription>
              {editingCategory ? 'Update the category details' : 'Create a new category for organizing tags'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Linking, Reactive Charts"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366f1"
                    className="font-mono"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSubmitting} variant="default" className="flex-1">
                  {isSubmitting ? (editingCategory ? "Updating..." : "Creating...") : (editingCategory ? "Update Category" : "Create Category")}
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
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => toggleSort('color')}
                >
                  <div className="flex items-center gap-1">
                    Color
                    {sortColumn === 'color' ? (
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading categories...
                  </TableCell>
                </TableRow>
              ) : sortedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {searchQuery ? "No categories match your search" : "No categories found"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? "Try adjusting your search criteria" : "Get started by creating your first category"}
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => setShowAddPanel(true)} className="flex items-center gap-2 mt-2">
                          <Plus className="h-4 w-4" />
                          Add Category
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <Badge
                        variant="secondary"
                        className="text-sm px-2 py-1 font-medium border-none transition-colors"
                        style={{
                          backgroundColor: `${category.color || '#6366f1'}2b`,
                          color: category.color || '#6366f1',
                        }}
                      >
                        {category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: category.color || "#6366f1" }}
                        />
                        <span className="text-sm font-mono">
                          {category.color || "#6366f1"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {category.description ? (
                        <span className="text-sm">{category.description}</span>
                      ) : (
                        <span className="text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
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
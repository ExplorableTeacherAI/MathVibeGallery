import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddSubjectAreaPanel } from "@/components/AddSubjectAreaPanel";
import { useToast } from "@/hooks/use-toast";
import { SearchInput } from "@/components/SearchInput";

interface SubjectArea {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

type SortColumn = 'name' | 'description' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

export const SubjectAreas = () => {
  const [subjectAreas, setSubjectAreas] = useState<SubjectArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingArea, setEditingArea] = useState<SubjectArea | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();

  // Filter subject areas based on search query
  const filteredSubjectAreas = useMemo(() => {
    if (!searchQuery.trim()) return subjectAreas;

    const query = searchQuery.toLowerCase();
    return subjectAreas.filter(area =>
      area.name.toLowerCase().includes(query) ||
      (area.description && area.description.toLowerCase().includes(query))
    );
  }, [subjectAreas, searchQuery]);

  // Toggle sort column and direction
  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort filtered subject areas
  const sortedSubjectAreas = useMemo(() => {
    if (!sortColumn) return filteredSubjectAreas;

    return [...filteredSubjectAreas].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortColumn) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
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
  }, [filteredSubjectAreas, sortColumn, sortDirection]);


  const fetchSubjectAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_area')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjectAreas(data || []);
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subject areas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectAreas();
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
      if (editingArea) {
        // Update existing subject area
        const { error } = await supabase
          .from('subject_area')
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq('id', editingArea.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Subject area updated successfully",
        });
      } else {
        // Create new subject area
        const { error } = await supabase
          .from('subject_area')
          .insert([{
            name: name.trim(),
            description: description.trim() || null,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Subject area created successfully",
        });
      }

      // Reset form
      setName("");
      setDescription("");
      setEditingArea(null);
      setShowAddPanel(false);

      // Refresh the list
      fetchSubjectAreas();
    } catch (error) {
      console.error('Error saving subject area:', error);
      toast({
        title: "Error",
        description: "Failed to save subject area",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (area: SubjectArea) => {
    setEditingArea(area);
    setName(area.name);
    setDescription(area.description || "");
    setShowAddPanel(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject area? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('subject_area')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubjectAreas(subjectAreas.filter(area => area.id !== id));
      toast({
        title: "Success",
        description: "Subject area deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subject area:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject area",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setEditingArea(null);
    setShowAddPanel(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading subject areas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subject Areas Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage educational subject areas and topics
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-lg font-semibold text-blue-600">
              Total Subject Areas: {subjectAreas.length}
            </span>
            {searchQuery && (
              <span className="text-sm text-muted-foreground">
                ({filteredSubjectAreas.length} filtered)
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setShowAddPanel(true)} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Subject Area
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search subject areas by name or description..."
          className="max-w-md"
        />
      </div>

      {showAddPanel && (
        <Card className="mb-8 bg-muted/50">
          <CardHeader>
            <CardTitle>{editingArea ? 'Edit Subject Area' : 'Add New Subject Area'}</CardTitle>
            <CardDescription>
              {editingArea ? 'Update the subject area details' : 'Create a new mathematics subject area'}
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
                  placeholder="e.g., Algebra, Geometry, Probability"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this subject area"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (editingArea ? "Updating..." : "Creating...") : (editingArea ? "Update Subject Area" : "Create Subject Area")}
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
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading subject areas...
                  </TableCell>
                </TableRow>
              ) : sortedSubjectAreas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      {searchQuery ? (
                        <>
                          <h3 className="text-lg font-semibold">No subject areas match your search</h3>
                          <p className="text-muted-foreground">
                            Try adjusting your search criteria
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold">No subject areas found</h3>
                          <p className="text-muted-foreground">
                            Get started by creating your first subject area
                          </p>
                          <Button onClick={() => setShowAddPanel(true)} className="flex items-center gap-2 mt-2">
                            <Plus className="h-4 w-4" />
                            Add Subject Area
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedSubjectAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell className="max-w-md">
                      {area.description ? (
                        <span className="text-sm">{area.description}</span>
                      ) : (
                        <span className="text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(area.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(area)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(area.id)}
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
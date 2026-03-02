import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, ExternalLink, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddArticlePanel } from "@/components/AddArticlePanel";
import { SearchInput } from "@/components/SearchInput";
import { BarChart } from "@/components/BarChart";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  title: string;
  link: string;
  year: number | null;
  subject: string;
  subject_area_id: string;
  source: string | null;
  created_at: string;
  subject_area?: {
    name: string;
  };
}

type SortColumn = 'title' | 'subject_area' | 'subject' | 'year' | 'created_at' | null;
type SortDirection = 'asc' | 'desc';

export const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chartsCollapsed, setChartsCollapsed] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;

    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.subject.toLowerCase().includes(query) ||
      article.subject_area?.name?.toLowerCase().includes(query) ||
      (article.year !== null && article.year.toString().includes(query))
    );
  }, [articles, searchQuery]);

  // Toggle sort column and direction
  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column clicked
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, set to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort filtered articles
  const sortedArticles = useMemo(() => {
    if (!sortColumn) return filteredArticles;

    return [...filteredArticles].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortColumn) {
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'subject_area':
          valueA = (a.subject_area?.name || 'Unknown').toLowerCase();
          valueB = (b.subject_area?.name || 'Unknown').toLowerCase();
          break;
        case 'subject':
          valueA = a.subject.toLowerCase();
          valueB = b.subject.toLowerCase();
          break;
        case 'year':
          // Null years go to the end
          valueA = a.year ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          valueB = b.year ?? (sortDirection === 'asc' ? Infinity : -Infinity);
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
  }, [filteredArticles, sortColumn, sortDirection]);

  // Calculate subject area distribution
  const subjectAreaDistribution = useMemo(() => {
    const distribution = articles.reduce((acc, article) => {
      const subjectArea = article.subject_area?.name || 'Unknown';
      acc[subjectArea] = (acc[subjectArea] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(distribution)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // If more than 10 subject areas, group the rest into "Other"
    if (sorted.length > 10) {
      const top10 = sorted.slice(0, 10);
      const otherCount = sorted.slice(10).reduce((sum, item) => sum + item.value, 0);
      return { data: [...top10, { label: 'Other', value: otherCount }], totalUnique: sorted.length };
    }

    return { data: sorted, totalUnique: sorted.length };
  }, [articles]);

  // Calculate year distribution
  const yearDistribution = useMemo(() => {
    const distribution = articles.reduce((acc, article) => {
      const year = article.year !== null ? article.year.toString() : 'NA';
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        // Put NA at the end
        if (a.label === 'NA') return 1;
        if (b.label === 'NA') return -1;
        // Sort years chronologically (oldest to newest)
        return parseInt(a.label) - parseInt(b.label);
      });
  }, [articles]);

  // Calculate source distribution
  const sourceDistribution = useMemo(() => {
    const distribution = articles.reduce((acc, article) => {
      // Extract domain without protocol for display
      const source = article.source
        ? article.source.replace(/^https?:\/\//, '')
        : 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(distribution)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // If more than 10 sources, group the rest into "Other"
    if (sorted.length > 10) {
      const top10 = sorted.slice(0, 10);
      const otherCount = sorted.slice(10).reduce((sum, item) => sum + item.value, 0);
      return { data: [...top10, { label: 'Other', value: otherCount }], totalUnique: sorted.length };
    }

    return { data: sorted, totalUnique: sorted.length };
  }, [articles]);


  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          subject_area (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleArticleAdded = (newArticle: Article) => {
    setShowAddPanel(false);
    setEditingArticle(null);
    fetchArticles(); // Refresh the list
    toast({
      title: "Success",
      description: editingArticle ? "Article updated successfully" : "Article added successfully",
    });
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setShowAddPanel(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setArticles(articles.filter(article => article.id !== id));
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Articles Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your articles and educational content
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-lg font-semibold text-blue-600">
              Total Articles: {articles.length}
            </span>
            {searchQuery && (
              <span className="text-sm text-muted-foreground">
                ({filteredArticles.length} filtered)
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChartsCollapsed(!chartsCollapsed)}
              className="flex items-center gap-2"
            >
              {chartsCollapsed ? (
                <>
                  <span className="text-sm">Show Charts</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="text-sm">Hide Charts</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        <Button onClick={() => setShowAddPanel(true)} variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Article
        </Button>
      </div>

      {/* Charts Section - Collapsible */}
      {!chartsCollapsed && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <BarChart
                  data={subjectAreaDistribution.data}
                  title="Articles by Subject Area"
                  subtitle={`Total: ${subjectAreaDistribution.totalUnique} areas`}
                  height={120}
                />
              </div>
              <div className="w-full">
                <BarChart
                  data={yearDistribution}
                  title="Articles by Year"
                  height={120}
                />
              </div>
            </div>
            <div className="w-full">
              <BarChart
                data={sourceDistribution.data}
                title="Articles by Source"
                subtitle={`Total: ${sourceDistribution.totalUnique} sources`}
                height={120}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search articles by title, subject, subject area, or year..."
          className="max-w-md"
        />
      </div>

      {(showAddPanel || editingArticle) ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingArticle ? "Edit Article" : "Add New Article"}</CardTitle>
          </CardHeader>
          <CardContent>
            <AddArticlePanel
              onArticleAdded={handleArticleAdded}
              onClose={() => {
                setShowAddPanel(false);
                setEditingArticle(null);
              }}
              article={editingArticle || undefined}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  {sortColumn === 'title' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => toggleSort('subject_area')}
              >
                <div className="flex items-center gap-1">
                  Subject Area
                  {sortColumn === 'subject_area' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => toggleSort('subject')}
              >
                <div className="flex items-center gap-1">
                  Subject
                  {sortColumn === 'subject' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => toggleSort('year')}
              >
                <div className="flex items-center gap-1">
                  Year
                  {sortColumn === 'year' ? (
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
                  Created
                  {sortColumn === 'created_at' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : sortedArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No articles match your search criteria." : "No articles found. Add your first article to get started."}
                </TableCell>
              </TableRow>
            ) : (
              sortedArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.subject_area?.name || 'Unknown'}</TableCell>
                  <TableCell>{article.subject}</TableCell>
                  <TableCell>{article.year ?? '-'}</TableCell>
                  <TableCell>{new Date(article.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  </TableCell>
                  <TableCell>
                    {article.source ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">
                          {article.source.replace(/^https?:\/\//, '')}
                        </span>
                        <a
                          href={article.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditArticle(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id)}
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
      </div>
    </div>
  );
};
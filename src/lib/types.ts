// Database types matching actual Supabase responses
export interface DatabaseCategory {
  id: string;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSubjectArea {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTag {
  id: string;
  tag_name: string;
  description?: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  categories?: DatabaseCategory;
}

export interface DatabaseArticle {
  id: string;
  title: string;
  link: string;
  year: number | null;
  subject: string;
  source: string | null;
  subject_area_id?: string;
  created_at: string;
  updated_at: string;
  subject_area?: DatabaseSubjectArea;
}

export interface DatabaseImage {
  id: string;
  image_url: string;
  article_id?: string;
  created_at: string;
  updated_at: string;
  article?: DatabaseArticle;
  image_tags?: {
    tag: DatabaseTag;
  }[];
}

// Simplified UI types (for backwards compatibility)
export interface Article {
  id: string;
  title: string;
  link: string;
  year: number | null;
  subject: string;
  source: string | null;
  subject_area_id: string | null;
  subject_area?: { id: string; name: string; };
}

export interface Tag {
  id: string;
  tag_name: string;
  description?: string;
  category_id: string;
  categories?: { name: string; color?: string; };
}

export interface Image {
  id: string;
  image_url: string;
  created_at: string;
  article?: Article;
  image_tags?: { tag: Tag }[];
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export interface SubjectArea {
  id: string;
  name: string;
  description?: string;
}
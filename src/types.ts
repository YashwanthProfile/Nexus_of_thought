export interface PostMetadata {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  heroImage?: string;
  authorId?: string;
  contributors?: string[];
}

export interface Post {
  slug: string;
  metadata: PostMetadata;
  content: string;
  backlinks: Array<{
    slug: string;
    title: string;
    summary?: string;
  }>;
}

export interface PostSummary extends PostMetadata {
  slug: string;
}

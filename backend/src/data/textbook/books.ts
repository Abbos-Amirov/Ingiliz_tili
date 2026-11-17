// The Pallo! textbook series — one book per level. A book is "available"
// once at least one of its lessons is authored in TEXTBOOK_LESSONS; the
// others show on the shelf as "coming soon". `coverUrl` is a path in the
// frontend's public/ folder.
export interface TextbookBook {
  level: number;
  title: string;
  subtitle: string;
  coverUrl: string | null;
}

export const TEXTBOOK_BOOKS: TextbookBook[] = [
  { level: 0, title: "Hello English", subtitle: "Start Talking", coverUrl: "/images/books/pallo-lv0.jpg" },
  { level: 1, title: "Level 1", subtitle: "", coverUrl: null },
  { level: 2, title: "Level 2", subtitle: "", coverUrl: null },
  { level: 3, title: "Level 3", subtitle: "", coverUrl: null },
];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string;
  author_name: string;
  author_email: string | null;
  question_text: string;
  status: 'pending' | 'published' | 'rejected';
  views: number;
  likes: number;
  created_at: string;
  categories?: Category;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  admin_id: string;
  answer_text: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface QuestionWithAnswer extends Question {
  categories: Category;
  answers: Answer[];
}

export interface Article {
  id: string;
  title: string;
  category_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  file_url: string | null;
  views: number;
  likes: number;
  status: 'draft' | 'published';
  admin_id: string;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  action_url: string;
  action_label: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface QuranTafsir {
  id: string;
  surah_number: number;
  surah_name: string;
  audio_url: string | null;
  notes: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuranAyahTafsir {
  id: string;
  surah_number: number;
  ayah_number: number;
  scholar_name: string;
  commentary: string;
  audio_url: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuranAyahMedia {
  id: string;
  surah_number: number;
  ayah_number: number;
  media_type: 'article' | 'audio' | 'video';
  title: string;
  url: string;
  article_id: string | null;
  admin_id: string | null;
  created_at: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

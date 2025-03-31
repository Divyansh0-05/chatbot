export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PackingList {
  categories: {
    name: string;
    items: string[];
  }[];
}
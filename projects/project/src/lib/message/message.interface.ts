export interface Message {
  id: string;
  content: string;
  type: 'success' | 'error' | 'warning' | 'info';
}



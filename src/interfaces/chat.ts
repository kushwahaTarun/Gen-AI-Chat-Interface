export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isComplete?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

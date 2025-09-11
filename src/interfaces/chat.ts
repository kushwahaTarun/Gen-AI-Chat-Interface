// TYPE FOR THE USER OR THE AI MESSAGES
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isComplete?: boolean;
  id: string;
  timestamp: Date | string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

export interface Architecture {
                modality: string,
                input_modalities: string[],
                output_modalities: string[],
                tokenizer: string,
                instruct_type: null
            }

export interface ModelArchitecture {
            id: string;
            canonical_slug: string;
            hugging_face_id: string;
            name: string;
            created: number,
            description: string;
            context_length: number,
            popular: boolean,
            speed: string,
            architecture: Architecture,
            quality: 'good' | 'high' | 'premium',
            specialties: string[],
            pricing: {
                prompt: string | number,
                completion: string,
                request: string,
                image: string,
                web_search: string,
                internal_reasoning: string
            },
            top_provider: {
                context_length: number,
                max_completion_tokens: null | number,
                is_moderated: boolean,
            },
            per_request_limits: null,
            supported_parameters: string[],
            capabilities: string[],
        }

// Interface for uploaded files
export interface UploadedFile {
  id: string;
  file: File;
  type: "image" | "video" | "document" | "audio" | "other";
  url: string;
  name: string;
  size: string;
}

// Interface for supported media configuration
export interface SupportedMedia {
  images: boolean;
  videos: boolean;
  documents: boolean;
  audio: boolean;
  acceptedTypes: string;
}
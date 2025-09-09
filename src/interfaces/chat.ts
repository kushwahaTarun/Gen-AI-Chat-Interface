export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isComplete?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
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
            speed: 'fast' | 'medium' | 'slow',
            quality: 'good' | 'high' | 'premium',
            specialties: string[],
            architecture: {
                modality: string,
                input_modalities: string[],
                output_modalities: string[],
                tokenizer: string,
                instruct_type: null
            },
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
            supported_parameters: string[]
        }
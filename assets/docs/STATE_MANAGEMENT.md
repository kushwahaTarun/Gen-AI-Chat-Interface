# State Management Documentation

## Redux Store Structure

### Chat Interface Slice
```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentConversationId: string | null;
}
```

### Authentication Slice
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

## Custom Hooks

### useChat.ts
- Manages chat interactions
- Handles message sending/receiving
- Controls loading states
- Error management

### useAuth.ts
- Authentication state management
- User session handling
- Protected route control
- Login/logout functions

### useConversation.ts
- Conversation management
- History tracking
- Active conversation control
- Message organization

### useMessageActions.ts
- Message operations
- Edit functionality
- Delete operations
- Export controls

### useTextToSpeech.ts
- Speech synthesis
- Voice control
- Language selection
- Playback management

## State Flow

### Message Flow
1. User Input → useChat
2. State Update → Redux Store
3. API Call → External Service
4. Response → State Update
5. UI Update → Components

### Authentication Flow
1. Login Action → useAuth
2. Firebase Auth → Token
3. State Update → Redux Store
4. Route Update → Navigation
5. UI Update → Components

## Performance Optimization

### State Selectors
- Memoized selectors
- Specific state slice selection
- Performance monitoring
- Cache management

### Action Creators
- Typed actions
- Payload validation
- Error handling
- Async operations

## Testing

### Unit Tests
- Redux reducers
- Action creators
- Selectors
- Custom hooks

### Integration Tests
- State flow
- Component interaction
- API integration
- Error scenarios

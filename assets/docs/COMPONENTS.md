# Components Documentation

## Core Components

### AppSidebar.tsx
```typescript
Purpose: Main sidebar container component
Props:
- None
Key Features:
- Manages sidebar state
- Handles responsive behavior
- Contains navigation elements
```

### Sidebar.tsx
```typescript
Purpose: Navigation and user interface sidebar
Props:
- None
Key Features:
- User profile display
- Navigation menu
- Theme toggle
- Logout functionality
```

### TextareaWithButtons.tsx
```typescript
Purpose: Main chat input component
Props:
- onSubmit: (message: string) => void
- isLoading: boolean
Key Features:
- Message input handling
- Speech-to-text integration
- Export functionality
- Loading state management
```

### SpeechToText.tsx
```typescript
Purpose: Voice input component
Props:
- onTranscript: (text: string) => void
- isListening: boolean
Key Features:
- Voice recognition
- Real-time transcription
- Error handling
- Status indicators
```

### ExportMsgBtn.tsx
```typescript
Purpose: Message export functionality
Props:
- messages: Message[]
- format: ExportFormat
Key Features:
- Multiple format support
- Download handling
- Progress indication
```

### RotatingIcon.tsx
```typescript
Purpose: Loading animation component
Props:
- isSpinning: boolean
- size?: string
Key Features:
- Smooth animation
- Configurable size
- Performance optimized
```

### Providers.tsx
```typescript
Purpose: Application context providers
Props:
- children: React.ReactNode
Key Features:
- Redux provider
- Theme provider
- Auth provider
- Toast notifications
```

## Component Interactions

### Chat Flow
1. TextareaWithButtons → Message Input
2. SpeechToText → Voice Input
3. Message Processing
4. UI Update
5. ExportMsgBtn → Export Options

### Authentication Flow
1. User Input
2. Firebase Authentication
3. Token Management
4. Route Protection
5. UI Update

### State Management Integration
1. Component Actions
2. Redux Dispatch
3. State Update
4. UI Re-render
5. Side Effects

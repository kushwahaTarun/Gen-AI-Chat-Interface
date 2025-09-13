# Architecture Overview

## Application Structure

The application follows a modular architecture with clear separation of concerns:

```
src/
├── app/                 # Next.js 13+ App Router pages
├── components/         # Reusable UI components
├── features/          # Redux slices and features
├── hooks/            # Custom React hooks
├── interfaces/       # TypeScript interfaces
├── lib/             # Utility functions and configurations
├── services/        # API and external service integrations
└── store/           # Redux store configuration
```

## Code Flow

### Request Flow
1. User interaction triggers an action (e.g., sending a message)
2. Action is dispatched through Redux
3. Relevant slice handles the state update
4. API calls are made through services
5. UI updates based on state changes

### Component Hierarchy
```
Layout (app/layout.tsx)
└── Providers
    └── Page (app/page.tsx)
        ├── AppSidebar
        │   └── Sidebar
        └── Chat Interface
            ├── TextareaWithButtons
            │   ├── SpeechToText
            │   └── ExportMsgBtn
            └── RotatingIcon
```

## State Management

- Uses Redux Toolkit for global state management
- Custom hooks for local state and business logic
- Real-time updates using Redux subscriptions

## Data Flow

1. User Input → Component State
2. Action Dispatch → Redux Store
3. API Integration → External Services
4. Response → State Update
5. UI Re-render

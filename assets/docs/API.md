# API Documentation

## Chat API

### POST /api/chat/route.js
Handles chat message processing and AI responses.

```typescript
Request:
{
  message: string;
  conversationId?: string;
  userId: string;
}

Response:
{
  response: string;
  conversationId: string;
  timestamp: number;
}
```

## Authentication API

### User Management
Firebase Authentication endpoints for:
- Sign Up
- Sign In
- Password Reset
- Token Refresh
- Logout

## WebSocket Integration

Real-time communication for:
- Message updates
- Typing indicators
- Online status
- Connection management

## Error Handling

### Error Responses
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Rate Limiting

- Max requests per minute: 60
- Max concurrent connections: 10
- Cooldown period: 60 seconds

## Security

### Headers
```typescript
{
  'Authorization': 'Bearer ${token}',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

### CORS Configuration
```typescript
{
  origin: ['allowed-origins'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

## API Versioning

Current Version: v1
Format: /api/v1/[endpoint]

## Testing

Endpoint testing using:
- Jest
- Supertest
- Mock Service Worker

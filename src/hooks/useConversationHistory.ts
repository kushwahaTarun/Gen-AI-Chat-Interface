import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isComplete: boolean;
  timestamp: string;
}

interface ConversationWithMessages {
  id: string;
  title: string;
  lastMessage: string;
  lastActivity: string | null;
  createdAt: string | null;
  messages: Message[]; // Array of messages within each conversation
}

export const useConversationHistory = (loggedInUser: any) => {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedInUser) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Reference to the user's conversations collection
    const conversationsRef = collection(
      db,
      'users',
      loggedInUser.uid,
      'conversations'
    );
    
    // Query conversations ordered by last activity (newest first)
    const q = query(conversationsRef, orderBy('lastActivity', 'desc'));

    // Set up real-time listener for conversations
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const conversationPromises: Promise<ConversationWithMessages>[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Create a promise to fetch messages for each conversation
          const conversationPromise = new Promise<ConversationWithMessages>((resolve) => {
            const messagesRef = collection(
              db,
              'users',
              loggedInUser.uid,
              'conversations',
              doc.id,
              'messages'
            );
            
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
            
            // Listen to messages for this conversation
            onSnapshot(messagesQuery, (messagesSnapshot) => {
              const messages: Message[] = [];
              
              messagesSnapshot.forEach((messageDoc) => {
                const messageData = messageDoc.data();
                messages.push({
                  id: messageDoc.id,
                  role: messageData.isBot ? 'assistant' : messageData.role,
                  content: messageData.content,
                  isComplete: messageData.isComplete,
                  timestamp: messageData.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                });
              });
              
              resolve({
                id: doc.id,
                title: data.title || 'New Chat',
                lastMessage: data.lastMessage || '',
                lastActivity: data.lastActivity?.toDate?.()?.toISOString() || null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                messages: messages, // Include all messages in the conversation object
              });
            });
          });
          
          conversationPromises.push(conversationPromise);
        });
        
        // Wait for all conversations to load their messages
        Promise.all(conversationPromises).then((loadedConversations) => {
          // Sort by lastActivity again since promises may resolve out of order
          loadedConversations.sort((a, b) => {
            if (!a.lastActivity || !b.lastActivity) return 0;
            return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
          });
          
          setConversations(loadedConversations);
          setLoading(false);
        });
        
        if (conversationPromises.length === 0) {
          setConversations([]);
          setLoading(false);
        }
      }, 
      (error) => {
        console.error('Error loading conversations:', error);
        setError('Failed to load conversations');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loggedInUser]);

  // Function to delete a conversation and all its messages
  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    if (!loggedInUser) return false;

    try {
      // Note: Deleting the conversation document will not automatically delete 
      // the messages subcollection. You might want to add logic to delete messages too
      await deleteDoc(doc(db, 'users', loggedInUser.uid, 'conversations', conversationId));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  };

  return {
    conversations,
    loading,
    error,
    deleteConversation
  };
};
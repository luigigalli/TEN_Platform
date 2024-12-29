import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message, InsertMessage } from "@db/schema";
import { z } from "zod";

// Validation schemas
const messageTypeSchema = z.enum([
  'expert_inquiry',
  'trip_discussion',
  'booking_support',
  'admin_notice'
]);

const contextTypeSchema = z.enum([
  'trip',
  'booking',
  'service'
]);

type MessageType = z.infer<typeof messageTypeSchema>;
type ContextType = z.infer<typeof contextTypeSchema>;

const sendMessageDataSchema = z.object({
  receiverId: z.number().int().positive(),
  message: z.string().min(1),
  messageType: messageTypeSchema,
  contextId: z.number().int().positive().optional(),
  contextType: contextTypeSchema.optional(),
});

const messageResponseSchema = z.object({
  message: z.any(), // Replace with proper Message schema when available
  conversationId: z.string().min(1),
});

type SendMessageData = z.infer<typeof sendMessageDataSchema>;
type MessageResponse = z.infer<typeof messageResponseSchema>;

class MessageError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'MessageError';
  }
}

interface UseMessagesResult {
  messages: Message[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: MessageError | null;
  sendMessage: (data: SendMessageData) => Promise<MessageResponse>;
  markAsRead: (messageId: number) => Promise<Message>;
}

/**
 * Validates the conversation ID
 * @param conversationId - The conversation ID to validate
 * @throws {MessageError} If the conversation ID is invalid
 */
function validateConversationId(conversationId: string): void {
  if (!conversationId.match(/^[a-zA-Z0-9_-]+$/)) {
    throw new MessageError(
      'Invalid conversation ID format',
      400,
      'INVALID_CONVERSATION_ID'
    );
  }
}

/**
 * Hook to manage messages in a conversation
 * @param conversationId - Optional conversation ID to filter messages
 * @returns Object containing messages and message management functions
 * @throws {MessageError} If there are any validation or API errors
 */
export function useMessages(conversationId?: string): UseMessagesResult {
  const queryClient = useQueryClient();

  // Validate conversation ID if provided
  React.useEffect(() => {
    if (conversationId) {
      try {
        validateConversationId(conversationId);
      } catch (error) {
        console.error('Conversation ID validation failed:', error);
      }
    }
  }, [conversationId]);

  const { 
    data: messages, 
    isLoading,
    isError,
    error,
  } = useQuery<Message[], MessageError>({
    queryKey: conversationId 
      ? ["/api/messages", conversationId]
      : ["/api/messages"],
    enabled: !conversationId || conversationId.length > 0,
  });

  const sendMessage = useMutation<MessageResponse, MessageError, SendMessageData>({
    mutationFn: async (data: SendMessageData) => {
      try {
        // Validate input data
        const validatedData = sendMessageDataSchema.parse(data);

        const newConversationId = conversationId || `${validatedData.receiverId}_${Date.now()}`;
        
        // Validate generated conversation ID
        if (newConversationId) {
          validateConversationId(newConversationId);
        }

        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            ...validatedData,
            conversationId: newConversationId,
          }),
          credentials: "include",
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new MessageError(
            errorText,
            res.status,
            'API_ERROR'
          );
        }

        const responseData = await res.json();
        
        // Validate response data
        return messageResponseSchema.parse(responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new MessageError(
            `Validation error: ${error.message}`,
            400,
            'VALIDATION_ERROR'
          );
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update the conversation messages
      if (data.conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages", data.conversationId] 
        });
      }
      // Update the global messages list
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages"] 
      });
    },
  });

  const markAsRead = useMutation<Message, MessageError, number>({
    mutationFn: async (messageId: number) => {
      try {
        // Validate message ID
        if (!Number.isInteger(messageId) || messageId <= 0) {
          throw new MessageError(
            'Invalid message ID',
            400,
            'INVALID_MESSAGE_ID'
          );
        }

        const res = await fetch(`/api/messages/${messageId}/read`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new MessageError(
            errorText,
            res.status,
            'API_ERROR'
          );
        }

        return res.json();
      } catch (error) {
        if (error instanceof MessageError) {
          throw error;
        }
        throw new MessageError(
          error instanceof Error ? error.message : 'Unknown error',
          500,
          'UNKNOWN_ERROR'
        );
      }
    },
    onSuccess: (data) => {
      // Update the conversation messages
      if (conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages", conversationId] 
        });
      }
      // Update the global messages list
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages"] 
      });
    },
  });

  return {
    messages,
    isLoading,
    isError,
    error: error ?? null,
    sendMessage: sendMessage.mutateAsync,
    markAsRead: markAsRead.mutateAsync,
  };
}

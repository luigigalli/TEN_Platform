import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message, InsertMessage } from "@db/schema";

type MessageType = 'expert_inquiry' | 'trip_discussion' | 'booking_support' | 'admin_notice';
type ContextType = 'trip' | 'booking' | 'service';

interface SendMessageData {
  receiverId: number;
  message: string;
  messageType: MessageType;
  contextId?: number;
  contextType?: ContextType;
}

interface MessageResponse {
  message: Message;
  conversationId: string;
}

interface MessageError extends Error {
  message: string;
  status?: number;
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
 * Hook to manage messages in a conversation
 * @param conversationId Optional conversation ID to filter messages
 * @returns Object containing messages and message management functions
 */
export function useMessages(conversationId?: string): UseMessagesResult {
  const queryClient = useQueryClient();

  const { 
    data: messages, 
    isLoading,
    isError,
    error,
  } = useQuery<Message[], MessageError>({
    queryKey: conversationId 
      ? ["/api/messages", conversationId]
      : ["/api/messages"],
    enabled: !!conversationId,
  });

  const sendMessage = useMutation<MessageResponse, MessageError, SendMessageData>({
    mutationFn: async (data: SendMessageData) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          ...data,
          conversationId: conversationId || `${data.receiverId}_${Date.now()}`,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = new Error(await res.text()) as MessageError;
        error.status = res.status;
        throw error;
      }

      return res.json();
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
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const error = new Error(await res.text()) as MessageError;
        error.status = res.status;
        throw error;
      }

      return res.json();
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

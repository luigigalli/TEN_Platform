import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message, InsertMessage } from "@db/schema";

interface SendMessageData {
  receiverId: number;
  message: string;
  messageType: 'expert_inquiry' | 'trip_discussion' | 'booking_support' | 'admin_notice';
  contextId?: number;
  contextType?: 'trip' | 'booking' | 'service';
}

export function useMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: conversationId 
      ? ["/api/messages", conversationId]
      : ["/api/messages"],
    enabled: !!conversationId,
  });

  const sendMessage = useMutation({
    mutationFn: async (data: SendMessageData) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          conversationId: conversationId || `${data.receiverId}_${Date.now()}`,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages", conversationId] 
        });
      }
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages"] 
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages", conversationId] 
        });
      }
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages"] 
      });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
    markAsRead: markAsRead.mutateAsync,
  };
}

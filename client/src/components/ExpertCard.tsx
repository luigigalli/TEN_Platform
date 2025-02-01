import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "../hooks/use-messages";

interface Expert {
  id: number;
  name: string;
  speciality: string;
  location: string;
  image: string | null;
  rating: number;
}

interface ExpertCardProps {
  expert: Expert;
}

interface MessagePayload {
  receiverId: number;
  message: string;
  messageType: 'expert_inquiry';
}

interface MessageError extends Error {
  message: string;
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { sendMessage } = useMessages();

  const handleContact = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message",
      });
      return;
    }

    try {
      setIsSending(true);
      const payload: MessagePayload = {
        receiverId: expert.id,
        message: message.trim(),
        messageType: 'expert_inquiry',
      };

      await sendMessage(payload);

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
      setIsDialogOpen(false);
      setMessage("");
    } catch (error) {
      const messageError = error as MessageError;
      toast({
        variant: "destructive",
        title: "Error",
        description: messageError.message ?? "Failed to send message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={expert.image ?? undefined} 
                alt={`${expert.name}'s profile picture`} 
              />
              <AvatarFallback>{getInitials(expert.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{expert.name}</h3>
              <p className="text-sm text-muted-foreground">{expert.speciality}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-medium">{expert.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{expert.location}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
              aria-label={`Contact ${expert.name}`}
            >
              Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Contact {expert.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              aria-label="Message content"
              minLength={1}
              maxLength={1000}
              className="min-h-[120px] resize-none"
            />
            <Button 
              onClick={handleContact} 
              className="w-full" 
              disabled={isSending || !message.trim()}
            >
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChatInterfaceProps {
  projectId: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  message: string;
  timestamp: Date;
}

export default function ChatInterface({ projectId }: ChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      message: "Hello! I can help you understand the requirements analysis and compliance mappings. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/chat`, { message });
      return response.json();
    },
    onSuccess: (response) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        message: response.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        message: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: currentMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(currentMessage);
    setCurrentMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6" data-testid="chat-interface">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg"
        data-testid="button-chat-toggle"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 shadow-xl" data-testid="chat-panel">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium" data-testid="chat-title">Compliance Q&A</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-chat-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1" data-testid="chat-description">
              Ask about requirements and compliance mappings
            </p>
          </div>

          <div className="p-4 h-64 overflow-y-auto space-y-3" data-testid="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "items-start space-x-2"}`}
                data-testid={`chat-message-${message.id}`}
              >
                {message.type === "ai" && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                    AI
                  </div>
                )}
                <div
                  className={`rounded-lg p-2 text-sm max-w-xs ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  }`}
                  data-testid={`message-content-${message.id}`}
                >
                  <p>{message.message}</p>
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex items-start space-x-2" data-testid="chat-loading">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                  AI
                </div>
                <div className="bg-muted rounded-lg p-2 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex space-x-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about requirements..."
                disabled={sendMessage.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessage.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

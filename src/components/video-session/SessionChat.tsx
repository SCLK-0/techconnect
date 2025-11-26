import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile, Maximize2, X } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Message {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    full_name: string;
  };
}

interface SessionChatProps {
  sessionId: string;
  userId: string;
  disableFullscreen?: boolean;
  isMonitorMode?: boolean;
}

export function SessionChat({ sessionId, userId, disableFullscreen = false, isMonitorMode = false }: SessionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullscreenEmojiPicker, setShowFullscreenEmojiPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing messages
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      // Find the ScrollArea viewport and scroll it
      const scrollViewport = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("session_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("session_messages").insert({
      session_id: sessionId,
      user_id: userId,
      message: newMessage,
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const chatContent = (fullscreenMode = false) => (
    <>
      {/* Chat Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-background to-muted/30 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm">Session Chat</h3>
        {!disableFullscreen && !fullscreenMode && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFullscreen}
            className="h-8 w-8"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        {fullscreenMode && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFullscreen}
            className="h-8 w-8"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages - Fixed height with scroll */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full p-4">
          <div ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground py-12">
                <div>
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.user_id === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                        message.user_id === userId
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm break-words leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.user_id === userId ? "opacity-80" : "opacity-60"}`}>
                        {format(new Date(message.created_at), "p")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input - Hidden in monitor mode */}
      {!isMonitorMode && (
        <form onSubmit={sendMessage} className="p-3 border-t bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <Popover 
              open={fullscreenMode ? showFullscreenEmojiPicker : showEmojiPicker} 
              onOpenChange={fullscreenMode ? setShowFullscreenEmojiPicker : setShowEmojiPicker} 
              modal={true}
            >
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="center" 
                sideOffset={8}
                alignOffset={0}
                className="w-auto p-0 border-0 bg-transparent shadow-none"
                style={{ zIndex: 100000 }}
                avoidCollisions={true}
                collisionPadding={8}
              >
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setNewMessage((prev) => prev + emojiData.emoji);
                    if (fullscreenMode) {
                      setShowFullscreenEmojiPicker(false);
                    } else {
                      setShowEmojiPicker(false);
                    }
                  }}
                  width={280}
                  height={350}
                />
              </PopoverContent>
            </Popover>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {chatContent(false)}
      </div>

      {/* Fullscreen Modal */}
      {!disableFullscreen && (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col gap-0 [&>button]:hidden">
            <div className="flex-1 flex flex-col min-h-0">
              {chatContent(true)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

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
  sender_name?: string;
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
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false); // Prevent duplicate sends
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSentMessageRef = useRef<string>(""); // Track last sent message
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce timeout

  useEffect(() => {
    console.log(" SessionChat: Initializing for session:", sessionId, "isMonitorMode:", isMonitorMode);
    
    // Load existing messages
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${sessionId}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log(" SessionChat: New message received via realtime:", payload.new);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some(m => m.id === newMsg.id)) {
              console.log(" SessionChat: Duplicate message, skipping");
              return prev;
            }
            return [...prev, newMsg];
          });
          
          // Fetch sender name if not already known
          if (!userNames[newMsg.user_id]) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", newMsg.user_id)
              .single();
            
            if (profile) {
              setUserNames(prev => ({
                ...prev,
                [newMsg.user_id]: profile.full_name || "Unknown"
              }));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(" SessionChat: Subscription status:", status);
      });

    // Polling fallback for monitor/observer mode (in case realtime doesn't work due to RLS)
    let pollInterval: NodeJS.Timeout | null = null;
    if (isMonitorMode) {
      console.log(" SessionChat: Starting polling for monitor mode");
      pollInterval = setInterval(() => {
        loadMessages();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      console.log(" SessionChat: Unsubscribing from channel");
      channel.unsubscribe();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [sessionId, isMonitorMode]);

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
    console.log(" SessionChat: Loading messages for session:", sessionId);
    const { data, error } = await supabase
      .from("session_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(" SessionChat: Error loading messages:", error);
      return;
    }

    console.log(" SessionChat: Loaded", data?.length || 0, "messages");
    
    if (data) {
      setMessages(data);
      
      // Fetch user names for all unique user IDs
      const userIds = [...new Set(data.map(m => m.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach(p => {
            names[p.user_id] = p.full_name || "Unknown";
          });
          setUserNames(names);
        }
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent empty messages
    if (!newMessage.trim()) return;
    
    // Prevent duplicate sends
    if (isSending) {
      console.log("🚫 Message send already in progress, ignoring duplicate");
      return;
    }
    
    // Prevent sending the same message multiple times
    if (newMessage.trim() === lastSentMessageRef.current) {
      console.log("🚫 Duplicate message detected, ignoring");
      return;
    }
    
    // Clear any existing timeout
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }
    
    const messageToSend = newMessage.trim();
    console.log(" Sending message:", messageToSend);
    
    // Set sending state immediately
    setIsSending(true);
    lastSentMessageRef.current = messageToSend;
    
    // Clear input immediately for better UX
    setNewMessage("");
    
    try {
      const { error } = await supabase.from("session_messages").insert({
        session_id: sessionId,
        user_id: userId,
        message: messageToSend,
      });

      if (error) {
        console.error("❌ Error sending message:", error);
        // Restore message on error
        setNewMessage(messageToSend);
        lastSentMessageRef.current = "";
      } else {
        console.log(" Message sent successfully");
        // Clear the last sent message after a delay to allow for new messages
        sendTimeoutRef.current = setTimeout(() => {
          lastSentMessageRef.current = "";
        }, 2000); // 2 second cooldown
      }
    } catch (error) {
      console.error("❌ Exception sending message:", error);
      // Restore message on exception
      setNewMessage(messageToSend);
      lastSentMessageRef.current = "";
    } finally {
      // Always reset sending state
      setIsSending(false);
    }
  };

  // Handle Enter key press with proper event handling
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Create a synthetic form event
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      sendMessage(syntheticEvent);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, []);

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
                  <p className="text-xs mt-1">
                    {isMonitorMode ? "Waiting for participants to chat..." : "Start the conversation!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwnMessage = message.user_id === userId;
                  const senderName = userNames[message.user_id] || "Unknown";
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage && !isMonitorMode ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                          isOwnMessage && !isMonitorMode
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        {/* Always show sender name for clarity */}
                        <p className={`text-xs font-semibold mb-1 ${isOwnMessage && !isMonitorMode ? "opacity-90" : "text-primary"}`}>
                          {isOwnMessage && !isMonitorMode ? "You" : senderName}
                        </p>
                        <p className="text-sm break-words leading-relaxed">{message.message}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage && !isMonitorMode ? "opacity-80" : "opacity-60"}`}>
                          {format(new Date(message.created_at), "p")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input - Hidden in monitor mode or observer mode */}
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
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || isSending} 
              className="shrink-0"
              title={isSending ? "Sending..." : "Send message"}
            >
              {isSending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
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

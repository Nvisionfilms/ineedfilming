import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Loader2, Mail, User } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  message: string;
  read: boolean;
  created_at: string;
  sender_profile?: { email: string; full_name: string | null };
  recipient_profile?: { email: string; full_name: string | null };
}

const AdminMessages = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    // Real-time updates can be added later
  }, []); 

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      const { data: messagesData, error } = await api.getMessages();

      if (error) throw new Error(error);

      setMessages(messagesData || []);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) {
      toast({
        title: "Message required",
        description: "Please enter your reply",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("client_messages").insert({
        sender_id: user.id,
        recipient_id: selectedMessage.sender_id,
        subject: selectedMessage.subject ? `Re: ${selectedMessage.subject}` : null,
        message: replyText,
      });

      if (error) throw error;

      toast({
        title: "Reply sent",
        description: "Your message has been sent successfully",
      });
      setReplyDialogOpen(false);
      setReplyText("");
      setSelectedMessage(null);
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("client_messages")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error("Error marking message as read:", error);
    }
  };

  const openReply = (msg: Message) => {
    setSelectedMessage(msg);
    setReplyDialogOpen(true);
    if (!msg.read) {
      markAsRead(msg.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground mt-1">Communicate with your clients</p>
            </div>
          </div>

          <div className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((msg) => {
                const isReceived = msg.sender_id !== msg.recipient_id;

                return (
                  <Card 
                    key={msg.id} 
                    className={!msg.read && isReceived ? "border-primary" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {msg.subject || "No subject"}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>
                              From: {msg.sender_profile?.full_name || msg.sender_profile?.email || "Unknown"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            To: {msg.recipient_profile?.full_name || msg.recipient_profile?.email || "Unknown"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {isReceived && !msg.read && (
                            <Badge variant="default">New</Badge>
                          )}
                          <Badge variant="outline">
                            {isReceived ? "Received" : "Sent"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap mb-4">{msg.message}</p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                        {isReceived && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReply(msg)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reply to Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {selectedMessage && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium mb-1">Original message:</p>
                    <p className="text-muted-foreground line-clamp-3">{selectedMessage.message}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reply">Your Reply</Label>
                  <Textarea
                    id="reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={handleReply} 
                  disabled={sending || !replyText.trim()} 
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
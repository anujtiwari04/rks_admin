import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, MoreVertical, Edit, Trash2, X, Check } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils"; // Import cn utility
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog
import { useToast } from "@/hooks/use-toast"; // Import useToast

// --- UPDATED: Message interface ---
interface ChatMessage {
  _id: string;
  content: string;
  planName: string;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;   // --- NEW ---
  isDeleted: boolean;  // --- NEW ---
}
// --- END UPDATED ---

const AdminChat = () => {
  const { planName } = useParams<{ planName: string }>();
  const decodedPlanName = planName ? decodeURIComponent(planName) : "";
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- NEW: State for editing and deleting ---
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For send, edit, delete
  // --- END NEW ---

  const fetchMessages = async () => {
    if (!decodedPlanName) return;
    try {
      setIsLoading(true);
      setError(null);
      // [cite: rks_backend/src/routes/chat.routes.js]
      const data = await api.get<ChatMessage[]>(`/chat/get/${decodedPlanName}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch messages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [decodedPlanName]);

  useEffect(() => {
    // Scroll to bottom when messages load or new one is added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (newMessage.trim() === "" || !decodedPlanName) return;

    const content = newMessage;
    setNewMessage(""); // Clear input immediately
    setIsSubmitting(true);

    try {
      // [cite: rks_backend/src/routes/chat.routes.js]
      const sentMessage = await api.post<ChatMessage>("/chat/create", {
        planName: decodedPlanName,
        content: content,
      });
      setMessages((prev) => [...prev, sentMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to send message.");
      setNewMessage(content); // Restore message on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW: Handle Edit ---
  const handleEditClick = (message: ChatMessage) => {
    setEditingMessage(message);
    setEditedContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditedContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || editedContent.trim() === "") return;

    setIsSubmitting(true);
    try {
      // [cite: rks_backend/src/routes/chat.routes.js]
      const updatedMessage = await api.put<ChatMessage>(
        `/chat/edit/${editingMessage._id}`,
        { content: editedContent }
      );
      
      // Update message in state
      setMessages(prev => 
        prev.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
      
      handleCancelEdit(); // Close edit UI
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to edit message.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- END NEW ---

  // --- NEW: Handle Delete ---
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    setIsSubmitting(true);
    try {
      // [cite: rks_backend/src/routes/chat.routes.js]
      const updatedMessage = await api.delete<ChatMessage>(
        `/chat/delete/${messageToDelete._id}`
      );
      
      // Update message in state
      setMessages(prev => 
        prev.map(msg => 
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
      
      setMessageToDelete(null); // Close dialog
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete message.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- END NEW ---

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSend();
    }
  };
  
  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSaveEdit();
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch {
      return '...';
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-6">{decodedPlanName} Updates</h1>

      <div
        ref={scrollRef}
        className="border rounded-lg bg-muted/50 h-[60vh] overflow-y-auto p-4 mb-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground">No messages yet.</div>
        ) : (
          messages.map((message) => {
            const isMe = message.author._id === user?.email; // Adjust this if you use user ID
            const isEditing = editingMessage?._id === message._id;

            return (
              <div
                key={message._id}
                className={cn(
                  "group relative bg-card border rounded-lg p-3 max-w-[85%] clear-both",
                  isMe
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto",
                  isEditing && "border-2 border-success ring-2 ring-success/20"
                )}
              >
                {/* --- NEW: Edit/Delete Dropdown --- */}
                {!message.isDeleted && !isEditing && (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100",
                          isMe ? "text-primary-foreground hover:bg-primary/50" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditClick(message)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setMessageToDelete(message)} 
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {/* --- END NEW --- */}

                {/* --- UPDATED: Show Edit UI or Message --- */}
                {isEditing ? (
                  <div className="space-y-2">
                    <Input 
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onKeyPress={handleEditKeyPress}
                      className="bg-card text-card-foreground"
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={handleCancelEdit} disabled={isSubmitting}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleSaveEdit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={cn(
                      "text-sm mb-1",
                      message.isDeleted && "italic text-muted-foreground opacity-80"
                    )}>
                      {message.content}
                    </p>
                    <p className={cn(
                      "text-xs",
                      isMe ? "opacity-80" : "text-muted-foreground"
                    )}>
                      {message.isEdited && !message.isDeleted && "(edited) "}
                      {formatTimestamp(message.createdAt)}
                    </p>
                  </>
                )}
                {/* --- END UPDATED --- */}

              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1"
          disabled={isSubmitting || !!editingMessage}
        />
        <Button onClick={handleSend} size="icon" disabled={isSubmitting || !!editingMessage}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* --- NEW: Delete Confirmation Dialog --- */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the message. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --- END NEW --- */}

    </div>
  );
};

export default AdminChat;
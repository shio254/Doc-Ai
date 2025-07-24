import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Send, 
  Trash2, 
  Download, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  FileText,
  Paperclip,
  CircleDot
} from "lucide-react";
import type { ChatMessage } from "@shared/schema";

export function ChatInterface() {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/chat/messages'],
    refetchInterval: 5000, // Refresh every 5 seconds to show new messages
  });

  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
  });

  const sendQueryMutation = useMutation({
    mutationFn: api.sendChatQuery,
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setQuery("");
      setIsTyping(false);
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: api.clearChatHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      toast({
        title: "Success",
        description: "Chat history cleared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear chat history.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !sendQueryMutation.isPending) {
      sendQueryMutation.mutate(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Response copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const documentCount = documents?.filter(d => d.status === 'completed').length || 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Ask anything about your documents
            </h2>
            <p className="text-sm text-slate-500">
              Get instant answers from your uploaded documentation
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearChatMutation.mutate()}
              disabled={clearChatMutation.isPending || !messages?.length}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {/* Welcome Message */}
        <div className="mb-8">
          <Card className="p-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div>
                <p className="text-slate-900 font-medium mb-2">Welcome to DocAI! 👋</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  I'm here to help you find information from your uploaded documents. You can ask me questions like:
                </p>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• "What's our vacation policy?"</li>
                  <li>• "How do I set up VPN access?"</li>
                  <li>• "What are the onboarding steps for new employees?"</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Chat Messages */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Card className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                </div>
              </div>
            ))}
          </div>
        ) : (
          messages?.map((message: ChatMessage) => (
            <div key={message.id} className="space-y-6 mb-6">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-primary text-white rounded-lg p-4 max-w-lg">
                  <p className="text-sm">{message.query}</p>
                  <p className="text-xs text-blue-200 mt-2">
                    {formatTimestamp(message.timestamp || new Date())}
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white text-sm" />
                </div>
                <div className="flex-1">
                  <Card className="p-4 shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-slate-900 text-sm leading-relaxed whitespace-pre-wrap">
                        {message.response}
                      </p>
                    </div>
                    
                    {/* Source Documents */}
                    {message.sourceDocuments && Array.isArray(message.sourceDocuments) && message.sourceDocuments.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <div className="text-xs font-medium text-slate-600 mb-2">Sources:</div>
                        <div className="space-y-1">
                          {message.sourceDocuments.map((source: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2 text-xs text-slate-500">
                              <FileText className="w-3 h-3" />
                              <span>{source.documentName} (Chunk {source.chunkIndex + 1})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{formatTimestamp(message.timestamp || new Date())}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          onClick={() => copyToClipboard(message.response)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-green-600"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <Card className="p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                  <span className="text-xs text-slate-500">AI is thinking...</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="flex items-end space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your documents..."
                className="resize-none pr-12 min-h-[44px] max-h-32"
                rows={1}
                maxLength={2000}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-2 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                Press Enter to send, Shift + Enter for new line
              </p>
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <span>{query.length}/2000</span>
                <div className="flex items-center space-x-1">
                  <CircleDot className={`w-2 h-2 ${documentCount > 0 ? 'text-green-500' : 'text-slate-400'}`} />
                  <span>{documentCount} documents loaded</span>
                </div>
              </div>
            </div>
          </div>
          <Button 
            type="submit"
            disabled={!query.trim() || sendQueryMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700 p-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

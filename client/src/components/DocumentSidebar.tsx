import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, FileText, Trash2, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentSidebarProps {
  onUploadClick: () => void;
}

export function DocumentSidebar({ onUploadClick }: DocumentSidebarProps) {
  const { toast } = useToast();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    staleTime: 30000,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: api.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDocument = (id: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    deleteDocumentMutation.mutate(id);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-600" />;
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-green-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
            <Upload className="w-3 h-3 mr-1" />
            Uploading
          </Badge>
        );
    }
  };

  const formatUploadDate = (date: Date | string | null) => {
    if (!date) return 'Unknown';
    const uploadDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return uploadDate.toLocaleDateString();
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">DocAI</h1>
            <p className="text-sm text-slate-500">Documentation Assistant</p>
          </div>
        </div>
        
        <Button 
          onClick={onUploadClick}
          className="w-full bg-primary text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-600 mb-3">Recent Documents</div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : !documents || (Array.isArray(documents) && documents.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-slate-400 text-xl" />
              </div>
              <p className="text-slate-500 text-sm">No documents uploaded yet</p>
              <p className="text-slate-400 text-xs mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            Array.isArray(documents) && documents.map((doc: Document) => (
              <Card key={doc.id} className="group bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                      {getFileIcon(doc.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Uploaded {formatUploadDate(doc.uploadedAt)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(doc.status)}
                        {doc.chunks && doc.chunks > 0 && (
                          <span className="text-xs text-slate-400">
                            {doc.chunks} chunks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 h-8 w-8 p-0"
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

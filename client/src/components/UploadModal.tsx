import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: api.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload PDF, TXT, or DOCX files.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 50MB. Please upload a smaller file.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    const newUploadFiles = validFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processUploads = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const fileIndex = uploadFiles.findIndex(f => f.file === pendingFiles[i].file);
      
      setUploadFiles(prev => prev.map((f, idx) => 
        idx === fileIndex ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadFiles(prev => prev.map((f, idx) => 
            idx === fileIndex && f.status === 'uploading' 
              ? { ...f, progress: Math.min(f.progress + 10, 90) } 
              : f
          ));
        }, 100);

        await uploadMutation.mutateAsync(pendingFiles[i].file);
        
        clearInterval(progressInterval);
        setUploadFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: 'completed', progress: 100 } : f
        ));

        toast({
          title: "Upload successful",
          description: `${pendingFiles[i].file.name} uploaded and is being processed.`,
        });
      } catch (error) {
        setUploadFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, status: 'error', progress: 0, error: error.message } 
            : f
        ));

        toast({
          title: "Upload failed",
          description: `Failed to upload ${pendingFiles[i].file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    setUploadFiles([]);
    onClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-600" />;
    }
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-green-600" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const totalFiles = uploadFiles.length;
  const totalSize = uploadFiles.reduce((sum, f) => sum + f.file.size, 0);
  const canProcess = uploadFiles.some(f => f.status === 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragOver ? 'border-primary bg-blue-50' : 'border-slate-300 hover:border-primary'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloudUpload className="text-slate-400 text-2xl" />
            </div>
            <h4 className="text-lg font-medium text-slate-900 mb-2">
              Drop files here or click to browse
            </h4>
            <p className="text-slate-500 text-sm mb-4">
              Support for PDF, DOCX, and TXT files up to 50MB each
            </p>
            <Button className="bg-primary text-white hover:bg-blue-700">
              Choose Files
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-3">
              {uploadFiles.map((uploadFile, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        {getFileIcon(uploadFile.file)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'uploading' && (
                        <span className="text-xs text-slate-500">
                          Uploading... {uploadFile.progress}%
                        </span>
                      )}
                      {uploadFile.status === 'completed' && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                          Completed
                        </Badge>
                      )}
                      {uploadFile.status === 'error' && (
                        <Badge variant="destructive">
                          Error
                        </Badge>
                      )}
                      {getStatusIcon(uploadFile.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="h-1" />
                  )}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Upload Summary */}
          {uploadFiles.length > 0 && (
            <Card className="p-4 bg-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total files:</span>
                <span className="font-medium">{totalFiles} files</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-600">Total size:</span>
                <span className="font-medium">{formatFileSize(totalSize)}</span>
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={processUploads}
            disabled={!canProcess || uploadMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700"
          >
            Process Documents
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

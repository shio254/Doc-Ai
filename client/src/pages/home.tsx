import { useState } from "react";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { UploadModal } from "@/components/UploadModal";

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <DocumentSidebar onUploadClick={() => setIsUploadModalOpen(true)} />
      <ChatInterface />
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
}

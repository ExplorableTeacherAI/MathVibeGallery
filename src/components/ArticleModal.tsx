import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddArticlePanel } from "./AddArticlePanel";

interface ArticleModalProps {
  onArticleAdded?: (article: any) => void;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export const ArticleModal = ({ 
  onArticleAdded, 
  triggerText = "Add Article",
  triggerVariant = "default",
  className = ""
}: ArticleModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleArticleAdded = (article: any) => {
    // Close the modal
    setIsOpen(false);
    
    // Call the parent callback if provided
    if (onArticleAdded) {
      onArticleAdded(article);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={`flex items-center gap-2 ${className}`}>
          <Plus className="h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Article</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AddArticlePanel 
            onArticleAdded={handleArticleAdded}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
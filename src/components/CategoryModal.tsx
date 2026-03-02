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
import { AddCategoryPanel } from "./AddCategoryPanel";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategoryModalProps {
  onCategoryAdded?: (category: Category) => void;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export const CategoryModal = ({ 
  onCategoryAdded, 
  triggerText = "Add Category",
  triggerVariant = "default",
  className = ""
}: CategoryModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryAdded = (category: Category) => {
    // Close the modal
    setIsOpen(false);
    
    // Call the parent callback if provided
    if (onCategoryAdded) {
      onCategoryAdded(category);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AddCategoryPanel 
            onCategoryAdded={handleCategoryAdded}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
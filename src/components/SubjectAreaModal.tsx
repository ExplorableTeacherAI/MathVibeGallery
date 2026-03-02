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
import { AddSubjectAreaPanel } from "@/components/AddSubjectAreaPanel";

interface SubjectArea {
  id: string;
  name: string;
  description: string;
}

interface SubjectAreaModalProps {
  onSubjectAreaAdded?: (subjectArea: any) => void;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export const SubjectAreaModal = ({ 
  onSubjectAreaAdded, 
  triggerText = "Add Subject Area",
  triggerVariant = "default",
  className = ""
}: SubjectAreaModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubjectAreaAdded = (subjectArea: SubjectArea) => {
    // Close the modal
    setIsOpen(false);
    
    // Call the parent callback if provided
    if (onSubjectAreaAdded) {
      onSubjectAreaAdded(subjectArea);
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
          <DialogTitle>Add New Subject Area</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AddSubjectAreaPanel 
            onSubjectAreaAdded={handleSubjectAreaAdded}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
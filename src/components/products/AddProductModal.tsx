'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductModalProvider, useProductModal } from "@/lib/context/product-modal-context";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import StepIndicator from "./StepIndicator";
import ProductSourceStep from "./steps/ProductSourceStep";
import ProductDetailsStep from "./steps/ProductDetailsStep";
import BrandGuidelinesStep from "./steps/BrandGuidelinesStep";
import ReviewStep from "./steps/ReviewStep";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  return (
    <ProductModalProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] p-6">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-xl font-semibold">Add New Product</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-8 w-8 rounded-full"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <AddProductContent onClose={onClose} />
        </DialogContent>
      </Dialog>
    </ProductModalProvider>
  );
}

function AddProductContent({ onClose }: { onClose: () => void }) {
  const STEPS = [
    { title: "Source", description: "Choose import method" },
    { title: "Details", description: "Product information" },
    { title: "Brand", description: "Colors & fonts" },
    { title: "Review", description: "Final check" }
  ];
  
  return (
    <div className="py-2">
      <StepIndicator steps={STEPS} />
      
      {/* Steps content */}
      <ModalStepContent onClose={onClose} />
    </div>
  );
}

// This component renders the current step content
function ModalStepContent({ onClose }: { onClose: () => void }) {
  const { state } = useProductModal();
  
  switch (state.step) {
    case 1:
      return <ProductSourceStep />;
    case 2:
      return <ProductDetailsStep />;
    case 3:
      return <BrandGuidelinesStep />;
    case 4:
      return <ReviewStep onSuccess={onClose} />;
    default:
      return <ProductSourceStep />;
  }
}



'use client';

import { cn } from "@/lib/utils";
import { useProductModal } from "@/lib/context/product-modal-context";

interface StepIndicatorProps {
  steps: { title: string; description: string }[];
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  const { state } = useProductModal();
  const currentStep = state.step;
  
  return (
    <div className="flex w-full mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div 
            key={step.title}
            className={cn(
              "flex-1 relative",
              index > 0 && "ml-0"
            )}
          >
            {/* Connecting line */}
            {index > 0 && (
              <div 
                className={cn(
                  "absolute top-5 h-0.5 w-full -left-1/2 -translate-y-1/2 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
            
            {/* Step circle with number */}
            <div className="flex flex-col items-center relative z-10">
              <div 
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors mb-2",
                  isActive ? "border-primary bg-primary text-primary-foreground" :
                  isCompleted ? "border-primary bg-primary text-primary-foreground" :
                  "border-muted bg-background text-muted-foreground"
                )}
              >
                {stepNumber}
              </div>
              
              {/* Step title and description */}
              <div className="text-center">
                <p 
                  className={cn(
                    "text-xs font-medium mb-0.5",
                    isActive || isCompleted ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

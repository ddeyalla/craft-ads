'use client';

import { Button } from "@/components/ui/button";
import { useProductModal } from "@/lib/context/product-modal-context";
import { ArrowLeft, Check, Edit, Loader2, PenIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  onSuccess: () => void;
}

export default function ReviewStep({ onSuccess }: ReviewStepProps) {
  const { state, setState, prevStep, goToStep } = useProductModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle saving the product
  const handleSaveProduct = async () => {
    try {
      setIsSubmitting(true);

      // 1. Upload images to Supabase Storage
      const imageUrls = await Promise.all(
        state.images.map(async (image) => {
          // For files that were uploaded (not from scraping)
          if (image.fileObj) {
            const file = image.fileObj;
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
              .from('products')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('products')
              .getPublicUrl(filePath);

            return {
              url: urlData.publicUrl,
              isPrimary: image.isPrimary,
              altText: image.altText || state.name
            };
          }

          // For images from scraping (already have URLs)
          return {
            url: image.url,
            isPrimary: image.isPrimary,
            altText: image.altText || state.name
          };
        })
      );

      // 2. Create product in database
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("User not authenticated");

      // 2. Insert product into Supabase
      const insertPayload = {
        user_id: user.data.user.id,
        product_type: state.productType,
        name: state.name,
        description: state.description,
        url: state.productUrl || null,
        images: imageUrls,
        brand_colors: state.brandColors,
        brand_fonts: state.brandFonts,
      };
      console.log('[handleSaveProduct] Insert payload:', insertPayload);
      const { error } = await supabase
        .from('products')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      // 3. Success - show message and close modal
      toast.success("Product added successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error?.message ? `Failed to save product: ${error.message}` : "Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Primary image (for preview)
  const primaryImage = state.images.find(img => img.isPrimary) || state.images[0];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">Review Your Product</h3>
        <p className="text-muted-foreground mt-2">Confirm the details before saving</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-medium">Product Details</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2" 
                onClick={() => goToStep(2)}
              >
                <PenIcon className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Product Type</p>
                <p className="font-medium capitalize">{state.productType}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Product Name</p>
                <p className="font-medium">{state.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{state.description}</p>
              </div>

              {state.productUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">Source URL</p>
                  <a 
                    href={state.productUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary underline truncate block"
                  >
                    {state.productUrl}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Brand Guidelines Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-medium">Brand Guidelines</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2" 
                onClick={() => goToStep(3)}
              >
                <PenIcon className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </div>

            <div className="space-y-4">
              {/* Color Swatches */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Brand Colors</p>
                <div className="flex gap-3">
                  {state.brandColors.primary && (
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-md" 
                        style={{ backgroundColor: state.brandColors.primary }}
                      />
                      <span className="text-xs mt-1">{state.brandColors.primary}</span>
                    </div>
                  )}
                  
                  {state.brandColors.secondary && (
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-md" 
                        style={{ backgroundColor: state.brandColors.secondary }}
                      />
                      <span className="text-xs mt-1">{state.brandColors.secondary}</span>
                    </div>
                  )}
                  
                  {state.brandColors.accent && (
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-md" 
                        style={{ backgroundColor: state.brandColors.accent }}
                      />
                      <span className="text-xs mt-1">{state.brandColors.accent}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fonts Preview */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Typography</p>
                
                {state.brandFonts.headline?.name && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Headline: {state.brandFonts.headline.name}</p>
                    <p 
                      className="text-lg" 
                      style={{ fontFamily: state.brandFonts.headline.name }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                )}
                
                {state.brandFonts.body?.name && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Body: {state.brandFonts.body.name}</p>
                    <p 
                      className="text-sm" 
                      style={{ fontFamily: state.brandFonts.body.name }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Images */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium">Product Images</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2" 
            onClick={() => goToStep(2)}
          >
            <PenIcon className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {state.images.map((image, index) => (
            <div 
              key={index} 
              className={cn(
                "relative border rounded-md overflow-hidden aspect-square",
                image.isPrimary ? "ring-2 ring-primary ring-offset-2" : ""
              )}
            >
              <Image
                src={image.url}
                alt={image.altText || "Product image"}
                fill
                className="object-cover"
              />
              
              {image.isPrimary && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ad Preview */}
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-4">Sample Ad Preview</h4>
        
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex gap-4">
            {primaryImage && (
              <div className="relative w-32 h-32 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText || state.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="flex-1">
              <h3 
                className="text-lg font-bold mb-1"
                style={{ 
                  color: state.brandColors.primary || 'inherit',
                  fontFamily: state.brandFonts.headline?.name 
                }}
              >
                {state.name}
              </h3>
              
              <p 
                className="text-sm line-clamp-3"
                style={{ fontFamily: state.brandFonts.body?.name }}
              >
                {state.description}
              </p>
              
              <div 
                className="mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: state.brandColors.secondary || '#e5e7eb',
                  color: '#fff' 
                }}
              >
                Learn More
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4 text-center">
            This is a sample of how your ad might look with the provided information
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Button 
          onClick={handleSaveProduct}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Product...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Product
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

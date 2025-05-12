'use client';

import { Button } from "@/components/ui/button";
import { useProductModal, ProductImage, ProductFormState } from "@/lib/context/product-modal-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, StarIcon, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

// Define the form schema with Zod
const productDetailsSchema = z.object({
  productType: z.enum(["physical", "digital", "service"], {
    required_error: "Please select a product type",
  }),
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  })
});

type ProductDetailsFormValues = z.infer<typeof productDetailsSchema>;

export default function ProductDetailsStep() {
  const { state, setState, prevStep, nextStep, updateImages, setPrimaryImage } = useProductModal();
  const [dragActive, setDragActive] = useState(false);

  // Initialize the form with values from context
  const form = useForm<ProductDetailsFormValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: {
      productType: state.productType || undefined,
      name: state.name || "",
      description: state.description || "",
    },
  });

  console.log("[ProductDetailsStep] Rendering. Errors:", form.formState.errors);
  console.log("[ProductDetailsStep] Initial productData (state from context):", state as ProductFormState);

  // Handle form submission
  const onSubmit = (data: ProductDetailsFormValues) => {
    console.log("[ProductDetailsStep] Form submitted with values:", data);
    // Validate images
    if (state.images.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }

    // Update state with form data
    setState(prev => ({
      ...prev,
      productType: data.productType,
      name: data.name,
      description: data.description,
    }));

    // Move to next step
    nextStep();
    console.log("[ProductDetailsStep] Form submission successful, proceeding to next step.");
  };

  // Handle going back to previous step
  const handleBack = () => {
    // Save current form values to state before going back
    const formValues = form.getValues();
    setState(prev => ({
      ...prev,
      productType: formValues.productType as any,
      name: formValues.name,
      description: formValues.description,
    }));

    prevStep();
  };

  // Handle image upload
  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: ProductImage[] = [];
    const existingUrls = new Set(state.images.map(img => img.url));

    // Process each file
    Array.from(files).forEach(file => {
      // Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(file);
      
      // Skip if this URL is already in our images array
      if (existingUrls.has(imageUrl)) return;

      newImages.push({
        url: imageUrl,
        isPrimary: state.images.length === 0 && newImages.length === 0, // First image is primary by default
        altText: file.name,
        fileObj: file
      });
    });

    // Update state with new images
    updateImages([...state.images, ...newImages]);
    
    // Show success message
    if (newImages.length > 0) {
      toast.success(`${newImages.length} image(s) added successfully`);
    }
  }, [state.images, updateImages]);

  // Handle drag events for image upload
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event for image upload
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  }, [handleImageUpload]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
    }
  };

  // Handle removing an image
  const handleRemoveImage = (index: number) => {
    const newImages = [...state.images];
    newImages.splice(index, 1);
    
    // If we removed the primary image, make the first remaining image primary
    if (state.images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    updateImages(newImages);
    toast.success("Image removed");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">Product Details</h3>
        <p className="text-muted-foreground mt-2">Enter information about your product</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Type Select */}
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => {
              console.log("[ProductDetailsStep] Rendering FormField for productType. Field state:", field);
              return (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="physical">Physical Product</SelectItem>
                      <SelectItem value="digital">Digital Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of product you&apos;re adding
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter product name" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This will be displayed in ads and product listings
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter product description" 
                    className="h-32 resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Describe your product. This information will be used in your ads.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload */}
          <div className="space-y-4">
            <FormLabel>Product Images</FormLabel>
            
            {/* Drag & Drop zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <ImagePlus className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium mb-1">Drag & drop product images here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Display uploaded images */}
            {state.images.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Uploaded Images</h4>
                <p className="text-xs text-muted-foreground mb-3">Click the star to set as primary image</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {state.images.map((image, index) => (
                    <div key={index} className="relative group border rounded-md overflow-hidden aspect-square">
                      <Image
                        src={image.url}
                        alt={image.altText || "Product image"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryImage(index);
                            }}
                          >
                            <StarIcon className={cn("h-4 w-4", image.isPrimary ? "fill-yellow-400 text-yellow-400" : "text-white")} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {image.isPrimary && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full p-1">
                          <StarIcon className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Requirement Message */}
            <p className="text-sm text-muted-foreground">
              Add at least one product image. Supported formats: JPG, PNG, WebP.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="submit" className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

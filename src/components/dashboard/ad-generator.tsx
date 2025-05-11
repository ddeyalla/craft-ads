'use client';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useAdGeneration } from '@/app/static-ads/ad-generation-context';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import Image from 'next/image';
import { Download, Upload, Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

// Define the expected API response structure
export type AdApiResponse = {
  id: string;
  title: string; // This is the original product title from input
  description: string; // Original product description from input
  adCopy: string; // Generated ad copy/headline
  imageUrl: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // status is implicitly 'generated'
};

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']),
});

export default function AdGenerator({ onSuccess }: { onSuccess: (generatedAd: AdApiResponse) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      aspectRatio: '1:1',
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        // Additional validation to ensure the file is actually an image
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          toast.error('Unsupported image format', {
            description: 'Please upload a PNG, JPEG, GIF, or WEBP image.',
          });
          return;
        }
        
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        if (rejection.errors[0].code === 'file-too-large') {
          toast.error('Image is too large', {
            description: 'Please upload an image smaller than 5MB',
          });
        } else if (rejection.errors[0].code === 'file-invalid-type') {
          toast.error('Unsupported image format', {
            description: 'Please upload a PNG, JPEG, GIF, or WEBP image.',
          });
        } else {
          toast.error('Invalid file', {
            description: rejection.errors[0].message,
          });
        }
      });
    },
  });

  async function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  // Get context for ad generation state management
  const { addSubmittedAd, updateAdStatus, removeAdInProgress } = useAdGeneration();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedFile) {
      toast.error('Please upload an image');
      return;
    }

    // Only disable the form temporarily while we prepare the submission
    // but enable it back quickly to allow concurrent submissions
    setIsLoading(true);
    
    try {
      console.log('[AdGenerator] Generating ad with:', values);
      
      // Store the form values and file for processing
      const formData = { ...values };
      const fileToProcess = selectedFile;
      
      // Add a new ad in 'submitted' state
      const adId = addSubmittedAd(values.title, values.description);
      
      // Reset form immediately to allow for new submissions
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Re-enable the form
      setIsLoading(false);
      
      // Update to 'generating' state
      setTimeout(() => {
        updateAdStatus(adId, 'generating');
      }, 500); // Short delay for visual feedback
      
      // Process the ad generation in the background
      processAdGeneration(adId, formData, fileToProcess);
      
      // Show a toast notification that the job has started
      toast.success('Ad generation started', {
        description: 'Your ad is being generated in the background',
      });
      
    } catch (error) {
      console.error('[AdGenerator] Error preparing ad generation:', error);
      toast.error('Error preparing ad generation', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      setIsLoading(false);
    }
  }
  
  // Function to process ad generation in the background
  async function processAdGeneration(
    adId: string, 
    formData: z.infer<typeof formSchema>, 
    fileToProcess: File
  ) {
    try {
      const imageBase64 = await toBase64(fileToProcess);
      const payload = {
        title: formData.title,
        description: formData.description,
        aspectRatio: formData.aspectRatio,
        imageBase64,
      };
      
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Remove the in-progress ad on error
        removeAdInProgress(adId);
        throw new Error(errorData.error || errorData.message || 'Failed to generate ad');
      }
      
      const data = await response.json();
      console.log('[AdGenerator] API response:', data);
      
      // Update status in context (optional, if still needed for UI)
      updateAdStatus(adId, 'generated');

      // Call the onSuccess prop with the API data
      onSuccess(data as AdApiResponse);
      
      // Remove the in-progress ad from the local context state as it's now handled by the parent
      removeAdInProgress(adId);
      
      // The actual saving to localStorage and global notification will be handled by static-ads/page.tsx
      // Toast can be moved to static-ads page after successful save there
      // For now, let's keep it to see if generation itself succeeded API-wise
      toast.success('Ad data received from API', {
        description: 'Processing and saving to library...',
      });
      
    } catch (error) {
      console.error('[AdGenerator] Error generating ad:', error);
      toast.error('Error generating ad', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  }

  return (
    <div className="space-y-4 pb-2 px-0">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Product image</h2>
        
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <div className={`border-1 border-dashed rounded-md transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}>
            {previewUrl ? (
              <div className="relative aspect-square">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  Click to change
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="small text-muted-foreground">Drag & drop an image here, or click to select</p>
                <em className="small text-muted-foreground">(Max 5MB, PNG, JPG, GIF, WEBP)</em>
              </div>
            )}
          </div>
        </div>
      </div>

      <Form {...form}>
        <div className="flex flex-col gap-3">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Eco friendly water bottle" {...field} />
                </FormControl>
                <FormDescription>
                  The name of your product
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your product, its features, benefits and target audience" 
                    className="h-[128px] max-h-[120px] overflow-y-auto resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Provide a detailed description of your product
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="aspectRatio"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Aspect Ratio</FormLabel>
                <FormControl>
                  <div className="flex w-full justify-start">
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-2"
                      aria-label="Select aspect ratio"
                    >
                      <ToggleGroupItem
                        value="1:1"
                        aria-label="Square 1:1"
                        className="px-4 py-2 rounded-md border data-[state=on]:bg-primary data-[state=on]:text-white"
                      >
                        Square
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="16:9"
                        aria-label="Landscape 16:9"
                        className="px-4 py-2 rounded-md border data-[state=on]:bg-primary data-[state=on]:text-white"
                      >
                        Landscape
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="9:16"
                        aria-label="Portrait 9:16"
                        className="px-4 py-2 rounded-md border data-[state=on]:bg-primary data-[state=on]:text-white"
                      >
                        Portrait
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </FormControl>
                <FormDescription>
                  Select the aspect ratio for your ad image
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full relative flex items-center justify-center overflow-hidden" disabled={isLoading}>
            <span
              className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            >
              Generate ads
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden={!isLoading}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </span>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Each generated ad takes 1 credit
          </p>
        </form>
        </div>
      </Form>
    </div>
  );
}

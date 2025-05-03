'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import Image from 'next/image';
import { Download, Upload } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']),
});

// Types 
type Ad = {
  id: string;
  title: string;
  description: string;
  adCopy: string;
  imageUrl?: string;
};

type StoredAd = {
  id: string;
  title: string;
  description: string;
  adCopy: string;
  imageUrl: string;
};

export default function AdGenerator({ onSuccess }: { onSuccess: () => void }) {
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
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
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

  function saveAd(adData: { title: string; description: string; adCopy: string; imageUrl: string; }) {
    const newAd: StoredAd = {
      id: new Date().toISOString(),
      title: adData.title,
      description: adData.description,
      adCopy: adData.adCopy,
      imageUrl: adData.imageUrl,
    };

    try {
      // Get existing ads from localStorage
      const existingAdsString = localStorage.getItem('ads');
      const existingAds: StoredAd[] = existingAdsString ? JSON.parse(existingAdsString) : [];
      
      // Add the new ad and save
      const updatedAds = [...existingAds, newAd];
      localStorage.setItem('ads', JSON.stringify(updatedAds));
      
      console.log('[AdGenerator] Ad saved to localStorage. Total ads:', updatedAds.length);
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Ad saved successfully', {
        description: 'Your ad has been added to the library',
      });
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error('[AdGenerator] Error saving ad to localStorage:', error);
      toast.error('Failed to save ad');
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedFile) {
      toast.error('Please upload an image');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('[AdGenerator] Generating ad with:', values);
      
      const imageBase64 = await toBase64(selectedFile);
      const payload = {
        title: values.title,
        description: values.description,
        aspectRatio: values.aspectRatio,
        imageBase64,
      };
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to generate ad');
      }
      
      const data = await response.json();
      console.log('[AdGenerator] API response:', data);
      
      // Save the generated ad
      saveAd({
        title: values.title,
        description: values.description,
        adCopy: data.adCopy,
        imageUrl: data.imageUrl,
      });
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('[AdGenerator] Error generating ad:', error);
      toast.error('Error generating ad', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
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
                <Upload className="h-4 w-4 mb-2 text-muted-foreground/70" />
                <p className="text-xs font-medium text-center">Drag and drop your product image or click to select</p>
                <p className="text-xs font-light mt-1">Max size: 5MB. Recommended 1000×1000</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Form {...form}>
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
                  <div className="flex w-full justify-center">
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
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Generating ad...' : 'Generate ads'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Each generated ad takes 1 credit
          </p>
        </form>
      </Form>
    </div>
  );
}

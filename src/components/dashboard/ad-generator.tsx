'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
});

export interface Ad {
  id: string;
  title: string;
  description: string;
  adCopy: string;
  imageUrl?: string;
}

interface StoredAd {
  id: string;
  title: string;
  description: string;
  adCopy: string;
  imageUrl: string;
}

export default function AdGenerator({ onSuccess }: { onSuccess: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<{
    headline: string;
    imageUrl: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 1024 * 1024, // 1MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedImage(acceptedFiles[0]);
        const preview = URL.createObjectURL(acceptedFiles[0]);
        setImagePreview(preview);
      }
    },
  });

  function saveAd(adData: {
    title: string;
    description: string;
    adCopy: string;
    imageUrl: string;
  }) {
    console.log('[Frontend] Attempting to save ad metadata (including Supabase URL) to localStorage');
    try {
      const existingAdsString = localStorage.getItem('ads');
      const existingAds: StoredAd[] = existingAdsString ? JSON.parse(existingAdsString) : [];

      const newAd: StoredAd = {
        id: new Date().toISOString(), // Simple unique ID
        title: adData.title,
        description: adData.description,
        adCopy: adData.adCopy,
        imageUrl: adData.imageUrl,
      };

      const MAX_STORED_ADS = 20;
      const updatedAds = [newAd, ...existingAds].slice(0, MAX_STORED_ADS);

      localStorage.setItem('ads', JSON.stringify(updatedAds));
      console.log('[Frontend] Ad metadata saved successfully to localStorage.');
    } catch (error: any) {
      console.error('[Frontend] Error saving ad to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        toast.error('Error Saving Ad', {
          description: `Could not save ad locally. Storage quota might be exceeded even with URLs. Try clearing some history.`,
        });
      } else {
        toast.error('Error Saving Ad', {
          description: `Could not save ad locally: ${error.message}.`,
        });
      }
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('[onSubmit] Form submitted with values:', values);
    if (!uploadedImage) {
      toast.error('Please upload a product image');
      console.warn('[onSubmit] Validation failed: No image uploaded.');
      return;
    }
    console.log('[onSubmit] Image validation passed.');

    try {
      setIsGenerating(true);
      console.log('[onSubmit] State reset, starting generation process...');

      console.log('[onSubmit] Starting Base64 conversion for uploaded image...');
      let imageBase64: string | null = null;
      try {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            if (base64String && base64String.startsWith('data:image/')) {
              resolve(base64String);
            } else {
              reject(new Error('Failed to read image as base64 data URL'));
            }
          };
          reader.onerror = (error) => {
            reject(new Error(`FileReader error: ${error}`));
          };
          reader.readAsDataURL(uploadedImage);
        });

        console.log('[onSubmit] Base64 conversion complete. Previewing original image.');
      } catch (error: any) {
        console.error('[onSubmit] Error during Base64 conversion:', error);
        throw error;
      }

      console.log('[onSubmit] Calling /api/generate-ad with payload:', {
        title: values.title,
        description: values.description.substring(0, 50) + '...',
        imageBase64: imageBase64 ? imageBase64.substring(0, 70) + '...' : 'null',
      });

      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          imageBase64: imageBase64,
        }),
      });

      console.log(`[onSubmit] Received response from /api/generate-ad. Status: ${response.status}`);
      if (!response.ok) {
        let errorData = { error: `API request failed with status ${response.status}` };
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('[onSubmit] Failed to parse error JSON from API response.');
        }
        console.error('[onSubmit] API Error Response Body:', errorData);
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('[onSubmit] Successfully parsed API Success Response:', {
        adCopy: result.adCopy,
        imageUrl: result.imageUrl ? result.imageUrl.substring(0, 100) + '...' : 'null',
      });

      if (!result.adCopy || !result.imageUrl) {
        console.error('[onSubmit] API success response missing adCopy or imageUrl.', result);
        throw new Error('API response missing adCopy or imageUrl');
      }

      console.log('[onSubmit] Updating state with generated ad and image URL, opening dialog...');
      setGeneratedAd({ headline: result.adCopy, imageUrl: result.imageUrl });
      setShowPreview(true);
      toast.success('Ad generated successfully!');
      onSuccess();

      console.log('[onSubmit] Calling saveAd function...');
      saveAd({
        title: values.title,
        description: values.description,
        adCopy: result.adCopy,
        imageUrl: result.imageUrl,
      });

    } catch (error: any) {
      console.error('[onSubmit] Error during ad generation process:', error);
      toast.error('Ad generation failed', {
        description: `An error occurred: ${error.message}. Check console for details.`,
      });
    } finally {
      console.log('[onSubmit] Finalizing generation process, setting isGenerating=false.');
      setIsGenerating(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create New Ad</CardTitle>
          <CardDescription>
            Fill in the details about your product to generate an ad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Eco-Friendly Water Bottle" {...field} />
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
                    <FormLabel>Product Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your product, its features, benefits, and target audience" 
                        className="min-h-32"
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
              
              <div>
                <FormLabel className="block mb-2">Product Image</FormLabel>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-40 h-40 mb-4">
                        <Image 
                          src={imagePreview} 
                          alt="Preview" 
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <p className="text-muted-foreground mb-1">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop an image here, or click to select'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max size: 1MB. Recommended: 1080×1350px
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <Button type="submit" disabled={isGenerating} className="w-full">
                {isGenerating ? 'Generating...' : 'Generate Ad'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Generated Ad</DialogTitle>
            <DialogDescription>
              Here&apos;s your AI-generated ad ready for social media
            </DialogDescription>
          </DialogHeader>
          
          {generatedAd ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-[4/5] mb-4 rounded-lg overflow-hidden">
                <Image 
                  src={generatedAd.imageUrl} 
                  alt="Generated Ad" 
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">{generatedAd.headline}</h3>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Skeleton className="w-full aspect-[4/5] rounded-lg" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPreview(false);
                onSuccess();
              }}
              className="w-full"
            >
              View in Library
            </Button>
            <Button 
              onClick={() => {
                setShowPreview(false);
                form.reset();
                setUploadedImage(null);
                setImagePreview(null);
                setGeneratedAd(null);
              }}
              className="w-full"
            >
              Create Another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

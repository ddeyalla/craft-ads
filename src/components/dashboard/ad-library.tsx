'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Add Ad type for static ads and fix Image src error
type Ad = {
  id: number;
  headline: string;
  image_url?: string;
  created_at: string;
  title: string;
  description: string;
  imageUrl: string;
};

export default function AdLibrary() {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  // Use localStorage for ads (simulate DB)
  const [ads, setAds] = useState<Ad[]>([]);
  const isLoading = false;

  useEffect(() => {
    console.log('[AdLibrary] Initializing and attempting to load ads from localStorage...');
    const storedAdsString = localStorage.getItem('ads');
    if (storedAdsString) {
      try {
        const storedAds: Ad[] = JSON.parse(storedAdsString);
        setAds(storedAds);
        console.log(`[AdLibrary] Successfully loaded ${storedAds.length} ads from localStorage.`);
      } catch (error) {
        console.error('[AdLibrary] Error parsing ads JSON from localStorage:', error);
        localStorage.removeItem('ads');
        setAds([]);
        // Optionally show a user notification about the reset
      }
    } else {
      console.log('[AdLibrary] No ads found in localStorage.');
    }
  }, []);

  function handleDownload(imageUrl: string | undefined, id: number, title: string) {
    try {
      const link = document.createElement('a');
      link.href = imageUrl ? imageUrl : '/placeholder.png';
      link.download = `vibecode-ad-${id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Ad "${title}" downloaded successfully`);
    } catch (error) {
      console.error('Error downloading ad:', error);
      toast.error('Failed to download ad');
    }
  };

  // Delete ad from library: remove from storage and state
  function handleDelete(ad: Ad) {
    console.log(`[AdLibrary] Attempting to delete ad with ID: ${ad.id}`);
    const updatedAds = ads.filter(a => a.id !== ad.id);
    setAds(updatedAds);
    localStorage.setItem('ads', JSON.stringify(updatedAds));
    console.log(`[AdLibrary] Ad ${ad.id} deleted. ${updatedAds.length} ads remaining.`);
    setShowPreview(false);
    toast.success(`Ad "${ad.title}" deleted successfully`);
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Your Ad Library</h2>
        <p className="text-muted-foreground">
          View, download, and manage your generated ads
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden flex flex-col">
              <Skeleton className="w-full aspect-[4/5]" />
              <CardContent className="flex-grow p-4 mt-auto">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ads && ads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden flex flex-col group relative">
              <div 
                className="relative w-full aspect-[4/5] cursor-pointer"
                onClick={() => {
                  setSelectedAd(ad);
                  setShowPreview(true);
                }}
              >
                {ad.image_url ? (
                  () => {
                    console.log(`[AdLibrary] Rendering image for Ad ID ${ad.id}. URL:`, ad.image_url);
                    return (
                      <Image 
                        src={ad.image_url} 
                        alt={ad.title} 
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.warn(`[AdLibrary] Failed to load image for Ad ID ${ad.id}. URL: ${ad.image_url}`, e);
                        }}
                      />
                    );
                  }
                )() : (
                  <div className="w-full aspect-[4/5] bg-gray-200" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-medium">Click to preview</p>
                </div>
              </div>
              <CardContent className="flex-grow p-4 mt-auto">
                <h3 className="font-medium truncate" title={ad.headline}>
                  {ad.headline}
                </h3>
                <p className="text-sm text-muted-foreground truncate" title={ad.title}>
                  {ad.title}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(ad.created_at).toLocaleDateString()}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Options
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(ad.image_url, ad.id, ad.title)}>
                        {ad.title.length > 0 ? '' : ''}
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedAd(ad);
                          setShowPreview(true);
                        }}
                      >
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(ad)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No ads yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate your first ad to see it here
          </p>
          <Button onClick={() => router.push('/dashboard?tab=generator')}>
            Create Your First Ad
          </Button>
        </div>
      )}
      
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ad Preview</DialogTitle>
            <DialogDescription>
              {selectedAd?.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAd ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-[4/5] mb-4 rounded-lg overflow-hidden">
                {selectedAd.image_url ? (
                  <Image 
                    src={selectedAd.image_url} 
                    alt={selectedAd.title} 
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.warn(`[AdLibrary] Failed to load image for Ad ID ${selectedAd.id}. URL: ${selectedAd.image_url}`, e);
                    }}
                  />
                ) : (
                  <div className="w-full aspect-[4/5] bg-gray-200" />
                )}
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">{selectedAd.headline}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedAd.description}
                </p>
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
              onClick={() => selectedAd && handleDownload(selectedAd.image_url, selectedAd.id, selectedAd.title)}
              className="w-full"
            >
              Download
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedAd && handleDelete(selectedAd)}
              className="w-full"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

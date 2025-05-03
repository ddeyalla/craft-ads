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
import { AdCard } from './ad-card';

// Add Ad type for static ads and fix Image src error
type Ad = {
  id: string;
  headline: string;
  image_url?: string;
  created_at: string;
  title: string;
  description: string;
  imageUrl: string;
};

interface StoredAd {
  id: string;
  title: string;
  description: string;
  adCopy: string;
  imageUrl: string;
}

export default function AdLibrary() {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  // Use localStorage for ads (simulate DB)
  const [ads, setAds] = useState<Ad[]>([]);
  const [storedAds, setStoredAds] = useState<StoredAd[]>([]);
  const isLoading = false;

  useEffect(() => {
    console.log('[AdLibrary] Initializing and attempting to load ads from localStorage...');
    const storedAdsString = localStorage.getItem('ads');
    if (storedAdsString) {
      try {
        const storedAds: StoredAd[] = JSON.parse(storedAdsString);
        setStoredAds(storedAds);
        const ads: Ad[] = storedAds.map((ad, idx) => ({
          id: `${ad.id}-${ad.title}-${idx}`,
          headline: ad.title,
          image_url: ad.imageUrl,
          created_at: new Date().toISOString(),
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
        }));
        setAds(ads);
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

  function handleDownload(imageUrl: string | undefined, id: string, title: string) {
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
    const updatedStoredAds = storedAds.filter(sa => sa.title !== ad.title || sa.description !== ad.description);
    setStoredAds(updatedStoredAds);
    localStorage.setItem('ads', JSON.stringify(updatedStoredAds));
    console.log(`[AdLibrary] Ad ${ad.id} deleted. ${updatedAds.length} ads remaining.`);
    setShowPreview(false);
    toast.success(`Ad "${ad.title}" deleted successfully`);
  };

  function handleDuplicate(ad: Ad) {
    try {
      const newAd: StoredAd = {
        id: new Date().toISOString(),
        title: ad.title,
        description: ad.description,
        adCopy: ad.headline,
        imageUrl: ad.imageUrl,
      };
      const updatedStoredAds = [...storedAds, newAd];
      setStoredAds(updatedStoredAds);
      localStorage.setItem('ads', JSON.stringify(updatedStoredAds));
      const newAds = [...ads, {
        id: `${newAd.id}-${newAd.title}-${updatedStoredAds.length - 1}`,
        headline: newAd.title,
        image_url: newAd.imageUrl,
        created_at: new Date().toISOString(),
        title: newAd.title,
        description: newAd.description,
        imageUrl: newAd.imageUrl,
      }];
      setAds(newAds);
      toast.success('Ad duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate ad:', error);
      toast.error('Failed to duplicate ad');
    }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-md overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : ads && ads.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ads.map(ad => (
            <AdCard
              key={ad.id}
              imageUrl={ad.imageUrl}
              adCopy={ad.headline}
              productTitle={ad.title}
              onDelete={() => handleDelete(ad)}
              onDuplicate={() => handleDuplicate(ad)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">No ads created yet</p>
          <p className="text-sm text-muted-foreground mt-1">Generate your first ad using the form</p>
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

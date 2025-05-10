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
import { Ad, AdStatus } from '@/types/ad';
import { AdInProgress } from '@/app/dashboard/page';

interface StoredAd {
  id: string;
  adCopy: string;
  productTitle: string;
  imageUrl: string;
  status?: AdStatus;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface AdLibraryProps {
  adsInProgress: AdInProgress[];
}

export default function AdLibrary({ adsInProgress }: AdLibraryProps) {
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const [ads, setAds] = useState<Ad[]>([]);
  const [storedAds, setStoredAds] = useState<StoredAd[]>([]);
  const isLoading = false;

  const loadAdsFromStorage = () => {
    console.log('[AdLibrary] Loading ads from localStorage...');
    const storedAdsString = localStorage.getItem('ads');
    if (storedAdsString) {
      try {
        const storedAdsData: StoredAd[] = JSON.parse(storedAdsString);
        setStoredAds(storedAdsData);
        const adsFromStorage: Ad[] = storedAdsData.map((storedAd, idx) => ({
          id: storedAd.id,
          adCopy: storedAd.adCopy || '',
          productTitle: storedAd.productTitle || '',
          imageUrl: storedAd.imageUrl || '',
          status: storedAd.status || 'generated',
          created_at: storedAd.created_at || new Date().toISOString(),
          updated_at: storedAd.updated_at || new Date().toISOString(),
          user_id: storedAd.user_id,
        }));
        const sortedAds = [...adsFromStorage].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAds(sortedAds);
        console.log(`[AdLibrary] Successfully loaded ${storedAdsData.length} ads from localStorage.`);
      } catch (error) {
        console.error('[AdLibrary] Error parsing ads JSON from localStorage:', error);
        localStorage.removeItem('ads');
        setAds([]);
      }
    } else {
      console.log('[AdLibrary] No ads found in localStorage.');
    }
  };

  useEffect(() => {
    loadAdsFromStorage();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      console.log('[AdLibrary] Storage change detected, reloading ads...');
      loadAdsFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ads-updated', handleStorageChange);

    const intervalId = setInterval(() => {
      loadAdsFromStorage();
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ads-updated', handleStorageChange);
      clearInterval(intervalId);
    };
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

  function handleDelete(ad: Ad) {
    console.log(`[AdLibrary] Attempting to delete ad with ID: ${ad.id}`);
    const updatedAds = ads.filter(a => a.id !== ad.id);
    setAds(updatedAds);
    const updatedStoredAds = storedAds.filter(sa => sa.id !== ad.id);
    setStoredAds(updatedStoredAds);
    localStorage.setItem('ads', JSON.stringify(updatedStoredAds));
    console.log(`[AdLibrary] Ad ${ad.id} deleted. ${updatedAds.length} ads remaining.`);
    setShowPreview(false);
    toast.success(`Ad "${ad.adCopy}" deleted successfully`);
  };

  function handleDuplicate(ad: Ad) {
    try {
      const newAd: StoredAd = {
        id: new Date().toISOString(),
        adCopy: ad.adCopy,
        productTitle: ad.productTitle,
        imageUrl: ad.imageUrl,
        status: ad.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: ad.user_id,
      };
      const updatedStoredAds = [...storedAds, newAd];
      setStoredAds(updatedStoredAds);
      localStorage.setItem('ads', JSON.stringify(updatedStoredAds));
      const newAdItem = {
        id: newAd.id,
        adCopy: newAd.adCopy,
        productTitle: newAd.productTitle,
        imageUrl: newAd.imageUrl,
        status: newAd.status || 'generated',
        created_at: newAd.created_at || new Date().toISOString(),
        updated_at: newAd.updated_at || new Date().toISOString(),
        user_id: newAd.user_id,
      };
      const newAds = [newAdItem, ...ads];
      setAds(newAds);
      toast.success('Ad duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate ad:', error);
      toast.error('Failed to duplicate ad');
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-md overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-3 space-y-1">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {adsInProgress.map(ad => (
            <AdCard
              key={ad.id}
              adCopy={ad.title}
              productTitle={ad.description}
              status={ad.status}
            />
          ))}
          {ads.map(ad => (
            <AdCard
              key={ad.id}
              id={ad.id}
              imageUrl={ad.imageUrl}
              adCopy={ad.adCopy}
              productTitle={ad.productTitle}
              onDelete={() => handleDelete(ad)}
              status={ad.status}
              createdAt={ad.created_at}
            />
          ))}
          {ads.length === 0 && adsInProgress.length === 0 && (
            <div className="text-center py-12 border rounded-md">
              <p className="text-muted-foreground">No ads created yet</p>
              <p className="text-sm text-muted-foreground mt-1">Generate your first ad using the form</p>
            </div>
          )}
        </div>
      )}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ad Preview</DialogTitle>
            <DialogDescription>
              {selectedAd?.adCopy}
            </DialogDescription>
          </DialogHeader>
          {selectedAd ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-[4/5] mb-4 rounded-lg overflow-hidden">
                {selectedAd.imageUrl ? (
                  <Image
                    src={selectedAd.imageUrl}
                    alt={selectedAd.adCopy}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.warn(`[AdLibrary] Failed to load image for Ad ID ${selectedAd.id}. URL: ${selectedAd.imageUrl}`, e);
                    }}
                  />
                ) : (
                  <div className="w-full aspect-[4/5] bg-gray-200" />
                )}
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">{selectedAd.adCopy}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedAd.productTitle}
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
              onClick={() => selectedAd && handleDownload(selectedAd.imageUrl, selectedAd.id, selectedAd.adCopy)}
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

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Ad } from '@/types/ad';
import Image from 'next/image';
import { useDebounce } from '@/lib/hooks/use-debounce';

function trimDescription(desc: string) {
  if (!desc) return '';
  return desc.length > 50 ? desc.slice(0, 50) + '...' : desc;
}

export default function AdPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const rawAdIdFromParams = params.id as string;
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(-1);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [isImageLoaded, setImageLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const descriptionRef = useRef<HTMLSpanElement | null>(null);

  const debouncedNavigate = useDebounce((url: string) => {
    setImageLoaded(false);
    router.push(url);
  }, 300);

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  const handleDownload = async () => {
    try {
      if (!ad?.imageUrl) {
        toast.error('No image available to download');
        return;
      }
      
      const response = await fetch(ad.imageUrl);
      const blob = await response.blob();
      
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const filename = `${ad.adCopy.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ad.jpg`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = () => {
    if (!ad) return;
    
    const shareableLink = `${window.location.origin}/preview/${ad.id}`;
    
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        toast.success("Shareable link copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  useEffect(() => {
    const storedAdsString = localStorage.getItem('ads');
    if (!storedAdsString) {
      setAllAds([]);
      setLoading(false);
      return;
    }
    const storedAds = JSON.parse(storedAdsString);
    const formattedAds: Ad[] = storedAds.map((adData: any, idx: number) => ({
      id: adData.id || `ad-${idx}-${Date.now()}`,
      adCopy: adData.title || adData.headline || '',
      productTitle: adData.description || '',
      imageUrl: adData.imageUrl || adData.image_url || '',
      status: adData.status || 'generated',
      created_at: adData.created_at || new Date().toISOString(),
      updated_at: adData.updated_at || new Date().toISOString(),
      user_id: adData.user_id,
      originalIndex: idx,
    }));
    const sortedAds = [...formattedAds].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAllAds(sortedAds);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof rawAdIdFromParams !== 'string') {
      setError('Invalid Ad ID in URL.');
      setLoading(false);
      setAd(null);
      setCurrentAdIndex(-1);
      return;
    }
    const decodedAdId = decodeURIComponent(rawAdIdFromParams);

    setLoading(true);      
    setImageLoaded(false); 

    if (!allAds.length) {
      if (!localStorage.getItem('ads')) { 
        setAd(null);
        setError('No ads available.');
        setCurrentAdIndex(-1);
      }
      setLoading(false); 
      return;
    }

    const idx = allAds.findIndex(localAd => localAd.id === decodedAdId);

    if (idx !== -1) { 
      setAd(allAds[idx]);
      setCurrentAdIndex(idx);
      setError(null); 
      setIsNavigating(false); 
      setLoading(false); 
    } else { 
      setError(null); 
      const firstAd = allAds[0];
      if (firstAd && firstAd.id && firstAd.id !== decodedAdId) {
        console.warn(`Ad with ID "${decodedAdId}" not found. Redirecting to first available ad: ${firstAd.id}`);
        router.replace(`/preview/${firstAd.id}`);
        return; 
      } else {
        setAd(null);
        let notFoundErrorMessage = 'The requested ad could not be found.';
        if (firstAd && firstAd.id === decodedAdId) {
          notFoundErrorMessage = `The ad data for "${decodedAdId}" appears to be missing or invalid.`;
        } else if (!firstAd) {
          notFoundErrorMessage = 'No ads are available to display.';
        }
        setError(notFoundErrorMessage);
        setCurrentAdIndex(-1);
        setLoading(false); 
      }
    }
  }, [rawAdIdFromParams, allAds, router]); 

  const handlePrevAd = useCallback(() => {
    if (currentAdIndex <= 0) return;
    const prevAd = allAds[currentAdIndex - 1];
    debouncedNavigate(`/preview/${prevAd.id}`);
  }, [currentAdIndex, allAds, debouncedNavigate]);

  const handleNextAd = useCallback(() => {
    if (currentAdIndex >= allAds.length - 1) return;
    const nextAd = allAds[currentAdIndex + 1];
    debouncedNavigate(`/preview/${nextAd.id}`);
  }, [currentAdIndex, allAds, debouncedNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevAd();
      } else if (e.key === 'ArrowRight') {
        handleNextAd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevAd, handleNextAd]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse w-[420px] h-[525px] rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <h1 className="text-2xl font-semibold mb-4 text-foreground">Ad not found</h1>
        <p className="text-muted-foreground mb-6">The ad you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <Link href="/static-ads">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {error && (
        <div className="fixed inset-0 bg-destructive/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg shadow-lg">
            <p className="text-destructive text-center">{error}</p>
          </div>
        </div>
      )}
      

      
      <div className="flex flex-col flex-1">
        <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 min-w-[180px]">
            <Button variant="ghost" size="icon" onClick={() => router.push('/static-ads')}>
              <X className="h-5 w-5" />
            </Button>
            <span className="text-lg font-semibold tracking-tight text-foreground">Static Ads</span>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-xl font-bold text-primary leading-tight">{ad.adCopy}</span>
            <span className="text-xs text-muted-foreground font-medium mt-1">{formatDate(ad.created_at)}</span>
          </div>
          
          <div className="flex items-center gap-2 min-w-[120px] justify-end">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-10 h-10 shadow-md"
              onClick={handlePrevAd}
              disabled={currentAdIndex <= 0}
              aria-label="Previous Ad"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-10 h-10 shadow-md"
              onClick={handleNextAd}
              disabled={currentAdIndex >= allAds.length - 1}
              aria-label="Next Ad"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </header>
        
        <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-[min(90vw,440px)] mx-auto">
            <div className="relative w-full max-w-full aspect-[4/5] rounded-xl overflow-hidden bg-muted/20 flex items-center justify-center shadow-sm">
              <Image
                src={ad?.imageUrl || "/fallback-image.png"}
                alt={ad?.adCopy || "Ad image"}
                fill
                className="object-contain w-full h-full rounded-xl"
                priority
              />
            </div>
            
            <div className="w-full text-center mt-6">
              <h2 className="text-2xl font-bold text-foreground">{ad?.adCopy}</h2>
              <div className="w-full text-center mt-4">
                <span
                  className="text-sm text-muted-foreground block max-w-full truncate line-clamp-1"
                  ref={descriptionRef}
                >
                  {ad.productTitle ? trimDescription(ad.productTitle) : ''}
                  {ad.productTitle && ad.productTitle.length > 50 && (
                    <>
                      <span> </span>
                      <button
                        className="inline text-primary text-xs font-medium ml-1 focus:outline-none underline hover:opacity-80 transition-opacity"
                        onClick={() => setShowDescriptionModal(true)}
                        aria-label="Read full description"
                      >
                        Read more
                      </button>
                    </>
                  )}
                </span>
              </div>
              
              <div className="flex justify-center gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex gap-2 min-w-[120px]"
                  onClick={handleDownload}
                  disabled={!ad.imageUrl}
                >
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button 
                  variant="default" 
                  className="flex gap-2 min-w-[120px]"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {showDescriptionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDescriptionModal(false);
          }}
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-background rounded-xl shadow-xl max-w-md w-full mx-4 relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Description</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDescriptionModal(false)}
                aria-label="Close description dialog"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="px-6 py-4 text-sm text-foreground whitespace-pre-line">
              {ad.productTitle}
            </div>
            <div className="px-6 py-3 border-t border-border flex justify-end">
              <Button variant="outline" onClick={() => setShowDescriptionModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

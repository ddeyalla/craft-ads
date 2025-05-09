'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// Define the Ad type
type Ad = {
  id: string;
  headline: string;
  image_url?: string;
  created_at: string;
  title: string;
  description: string;
  imageUrl: string;
  originalIndex?: number;
};

export default function AdPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const adId = params.id as string;
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(-1);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    // Load all ads from localStorage
    const loadAds = () => {
      try {
        const storedAdsString = localStorage.getItem('ads');
        if (!storedAdsString) {
          setLoading(false);
          return;
        }
        
        const storedAds = JSON.parse(storedAdsString);
        const formattedAds: Ad[] = storedAds.map((ad: any, idx: number) => ({
          id: ad.id, // Use the same ID format as in AdLibrary
          headline: ad.title,
          image_url: ad.imageUrl,
          created_at: ad.id || new Date().toISOString(),
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          originalIndex: idx,
        }));
        
        // Sort by date (newest first)
        const sortedAds = [...formattedAds].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setAllAds(sortedAds);
        
        // Find current ad by ID - improve matching logic
        const index = sortedAds.findIndex(ad => ad.id === adId);
        
        if (index !== -1) {
          setAd(sortedAds[index]);
          setCurrentAdIndex(index);
          console.log('Ad found:', sortedAds[index]);
        } else {
          // Fallback: Try partial matching or the first ad
          console.log('Ad not found with ID:', adId);
          console.log('Available ads:', sortedAds.map(ad => ({ id: ad.id, title: ad.title })));
          
          if (sortedAds.length > 0) {
            // If we have ads but couldn't find the exact match, use the first one
            setAd(sortedAds[0]);
            setCurrentAdIndex(0);
            console.log('Falling back to the first ad');
          } else {
            // No ads available
            toast.error("No ads found");
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading ad data:', error);
        setLoading(false);
        toast.error("Error loading ad data");
      }
    };
    
    loadAds();
  }, [adId]);

  const handlePrevAd = () => {
    if (currentAdIndex > 0) {
      const prevAd = allAds[currentAdIndex - 1];
      router.push(`/preview/${prevAd.id}`);
    }
  };

  const handleNextAd = () => {
    if (currentAdIndex < allAds.length - 1) {
      const nextAd = allAds[currentAdIndex + 1];
      router.push(`/preview/${nextAd.id}`);
    }
  };

  const handleDownload = async () => {
    try {
      if (!ad?.imageUrl) {
        toast.error('No image available to download');
        return;
      }
      
      // Fetch the image
      const response = await fetch(ad.imageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Generate filename from product title or use a default name
      const filename = `${ad.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ad.jpg`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
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
      .catch(err => {
        console.error('Failed to copy link:', err);
        toast.error("Failed to copy link");
      });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
      return formattedDate;
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-semibold mb-4">Ad not found</h1>
        <p className="text-muted-foreground mb-6">The ad you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="mr-4">
            <X className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-medium">Static Ads</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Ad image */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">{ad.title}</h2>
              <span className="text-sm text-muted-foreground">{formatDate(ad.created_at)}</span>
            </div>
            
            <div className="relative aspect-[4/5] md:aspect-auto md:flex-1 border rounded-lg overflow-hidden bg-muted/10">
              {ad.imageUrl ? (
                <Image 
                  src={ad.imageUrl} 
                  alt={ad.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-full"
                  onClick={handlePrevAd}
                  disabled={currentAdIndex <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-full" 
                  onClick={handleNextAd}
                  disabled={currentAdIndex >= allAds.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Download button */}
              <Button 
                variant="secondary" 
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download the ad image
              </Button>
            </div>
          </div>
          
          {/* Right side - Details */}
          <div className="w-full md:w-72 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-1">{ad.title}</h3>
              <div className={`text-sm ${!showFullDescription ? 'line-clamp-5' : ''}`}>
                {ad.description}
              </div>
              {ad.description && ad.description.length > 250 && (
                <button 
                  className="text-primary text-xs mt-1 font-medium"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
            
            {/* Uploaded image */}
            <div>
              <h3 className="text-sm font-medium mb-2">Image</h3>
              <div className="aspect-square w-20 h-20 relative rounded-md overflow-hidden border">
                {ad.imageUrl ? (
                  <Image 
                    src={ad.imageUrl} 
                    alt={ad.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                    <p className="text-xs text-muted-foreground">No image</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Aspect Ratio */}
            <div>
              <h3 className="text-sm font-medium mb-2">Aspect Ratio</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="border rounded-md px-2 py-1 text-center text-sm">
                  Square
                </div>
                <div className="border rounded-md px-2 py-1 text-center text-sm">
                  Landscape
                </div>
                <div className="border rounded-md px-2 py-1 text-center text-sm">
                  Portrait
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AdStatus = 'submitted' | 'generating' | 'generated';

interface AdCardProps {
  id?: string; // Add id prop for preview navigation
  imageUrl?: string;
  adCopy: string;
  productTitle: string;
  onDelete?: () => void;
  status?: AdStatus;
  createdAt?: string; // Add creation timestamp
}

export function AdCard({ id, imageUrl, adCopy, productTitle, onDelete, status = 'generated', createdAt }: AdCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Function to download the image
  const handleDownload = async () => {
    try {
      if (!imageUrl) {
        toast.error('No image available to download');
        return;
      }
      
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Generate filename from product title or use a default name
      const filename = `${productTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ad.jpg`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  // Render different content based on status
  const renderCardContent = () => {
    switch (status) {
      case 'submitted':
        return (
          <div className="relative aspect-square flex items-center justify-center bg-muted/30">
            <div className="text-center p-4">
              <p className="text-sm font-medium">Ad Submitted</p>
              <p className="text-xs text-muted-foreground mt-1">Your ad is queued for generation</p>
            </div>
          </div>
        );
      case 'generating':
        return (
          <div className="relative aspect-square flex flex-col items-center justify-center bg-muted/30">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
            <p className="text-sm font-medium">Generating Ad</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment...</p>
          </div>
        );
      case 'generated':
      default:
        return (
          <div className="relative aspect-square">
            {imageUrl ? (
              <Image 
                src={imageUrl} 
                alt={adCopy}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/30">
                <p className="text-sm text-muted-foreground">Image unavailable</p>
              </div>
            )}
          </div>
        );
    }
  };

  // Handle card click to navigate to preview page
  const handleCardClick = () => {
    // Only navigate if the card is in 'generated' state and has an id
    if (status === 'generated' && id) {
      router.push(`/preview/${id}`);
    }
  };

  return (
    <div 
      className="group relative rounded-md overflow-hidden bg-background border h-[320px] flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex-1 min-h-0">
        {renderCardContent()}
      </div>
      <div className="p-3 space-y-1.5 flex-shrink-0">
        <h3 className="font-medium text-sm line-clamp-1">{adCopy}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{productTitle}</p>
      </div>
      {status === 'generated' && (
        <div className={`absolute top-2 right-2 flex gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => {
              setIsSharing(true);
              // Create a shareable link (in a real app, this would be a unique URL)
              const shareableLink = `${window.location.origin}/shared-ad?img=${encodeURIComponent(imageUrl || '')}&title=${encodeURIComponent(productTitle)}`;
              
              // Copy to clipboard
              navigator.clipboard.writeText(shareableLink)
                .then(() => {
                  toast.success("Shareable link copied to clipboard");
                  setIsSharing(false);
                })
                .catch(err => {
                  console.error('Failed to copy link:', err);
                  toast.error("Failed to copy link");
                  setIsSharing(false);
                });
            }}
            disabled={isSharing}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

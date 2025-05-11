"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdStatus } from "@/types/ad";

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
      const filename = `${productTitle?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'ad'}-ad.jpg`;
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 p-2 text-center">
            <p className="font-medium">Ad Submitted</p>
            <p className="small text-muted-foreground mt-1">Your ad is queued for generation</p>
          </div>
        );
      case 'generating':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 p-2 text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-2 text-primary" />
            <p className="font-medium">Generating Ad</p>
            <p className="small text-muted-foreground mt-1">This may take a moment...</p>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 p-2 text-center">
            <p className="font-medium text-red-700">Generation Failed</p>
            <p className="small text-muted-foreground mt-1">Please try again later.</p>
            {/* Optionally, add a retry button or more info here */}
          </div>
        );
      case 'generated':
      default:
        if (!imageUrl) {
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-2 text-center">
              <p className="font-medium text-muted-foreground">Image Not Available</p>
            </div>
          );
        }
        return (
          <Image 
            src={imageUrl} 
            alt={adCopy}
            fill
            className="object-cover"
          />
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
      className="group relative rounded-md overflow-hidden bg-background border flex flex-col cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image/Status Area - This will define its own height based on width due to aspect-square */}
      <div className="relative w-full aspect-square bg-muted">
        {renderCardContent()} 
      </div>
      
      {/* Text Area */}
      <div className="p-2 sm:p-3 space-y-1">
        <h3 className="h6 font-medium line-clamp-1 break-all">{adCopy}</h3>
        <p className="small text-muted-foreground line-clamp-1 sm:line-clamp-2 break-all">{productTitle}</p>
      </div>

      {/* Hover Actions - positioned absolutely relative to the main card div */}
      {status === 'generated' && (
        <div className={`absolute top-2 right-2 flex gap-1 sm:gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click navigation
              setIsSharing(true);
              // Create a shareable link (in a real app, this would be a unique URL)
              const shareableLink = `${window.location.origin}/preview/${id}`;
              
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={(e) => e.stopPropagation()} // Prevent card click navigation
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

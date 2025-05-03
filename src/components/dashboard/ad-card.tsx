"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdCardProps {
  imageUrl: string;
  adCopy: string;
  productTitle: string;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export function AdCard({ imageUrl, adCopy, productTitle, onDelete, onDuplicate }: AdCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative rounded-md overflow-hidden bg-background border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square">
        <Image 
          src={imageUrl} 
          alt={adCopy}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm line-clamp-1">{adCopy}</h3>
        <p className="text-xs text-muted-foreground">{productTitle}</p>
      </div>
      <div className={`absolute top-2 right-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

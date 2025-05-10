'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react'; 
import { Ad, AdStatus } from '@/types/ad'; 
import { AuthRequiredWrapper } from '@/components/auth/AuthRequiredWrapper';
import { useAuth } from '@/lib/context/auth-context';
import { AdCard } from '@/components/dashboard/ad-card';

export default function NewDashboardPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    
    const storedAdsString = localStorage.getItem('ads');
    if (storedAdsString) {
      try {
        const parsedAds: Ad[] = JSON.parse(storedAdsString);
        
        // Filter ads to only show the current user's ads
        const userAds = parsedAds.filter(ad => ad.user_id === user.id);
        
        // Sort ads by creation date, newest first
        const sortedAds = [...userAds].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setAds(sortedAds);
      } catch (error) {
        console.error('Failed to parse ads from localStorage:', error);
        setAds([]); // Set to empty if parsing fails
      }
    }
    setLoading(false);
  }, [user?.id]);

  return (
    <AuthRequiredWrapper>
      <div className="min-h-screen bg-background text-foreground">
        <header className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome, {profile?.full_name || user?.user_metadata?.full_name || 'there'}
            </h1>
          </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" /> Book a call with the founder
          </Button>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">        
        {loading && (
          <div className="text-center py-10">
            <p>Loading ads...</p> {/* Replace with a spinner/skeleton later if desired */}
          </div>
        )}

        {!loading && ads.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No ads generated yet. <Link href="/static-ads" className="text-primary hover:underline">Create your first ad!</Link></p>
          </div>
        )}

        {!loading && ads.length > 0 && (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                imageUrl={ad.imageUrl}
                adCopy={ad.adCopy}
                productTitle={ad.productTitle}
                status={ad.status}
                createdAt={ad.created_at}
              />
            ))}
          </div>
        )}
      </main>
    </div>
    </AuthRequiredWrapper>
  );
}

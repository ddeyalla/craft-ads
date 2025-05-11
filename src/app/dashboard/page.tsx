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
import { Header } from '@/components/dashboard/header';

export default function NewDashboardPage() {
  const { profile, user, isLoading: authContextIsLoading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsAreLoading, setAdsAreLoading] = useState(true);

  // Function to load ads from localStorage
  const loadAdsFromLocalStorage = () => {
    if (user?.id) {
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
    }
    setAdsAreLoading(false);
  };

  // Effect for initial ad load and when user/auth state changes
  useEffect(() => {
    if (!authContextIsLoading) { // Only load if authentication process is complete
      loadAdsFromLocalStorage();
    }
  }, [user, authContextIsLoading]); // Rerun if user object or authContextIsLoading status changes

  // Effect to listen for custom 'ads-updated' event
  useEffect(() => {
    const handleAdsUpdated = () => {
      console.log('Received ads-updated event. Reloading ads...');
      loadAdsFromLocalStorage();
    };

    window.addEventListener('ads-updated', handleAdsUpdated);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('ads-updated', handleAdsUpdated);
    };
  }, [user]); // Rerun if user changes, to ensure loadAdsFromLocalStorage has the correct user context

  return (
    <AuthRequiredWrapper>
      <div className="min-h-screen bg-background text-foreground">
        <Header
          title={`Welcome, ${profile?.full_name || user?.user_metadata?.full_name || 'there'}`}
          right={
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" /> Book a call with the founder
            </Button>
          }
        />

        <main className="px-4 sm:px-6 lg:px-8 py-8">        
          {(authContextIsLoading || adsAreLoading) && (
            <div className="text-center py-10">
              <p>Loading ads...</p> {/* Replace with a spinner/skeleton later if desired */}
            </div>
          )}

          {!authContextIsLoading && !adsAreLoading && ads.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No ads generated yet. <Link href="/static-ads" className="text-primary hover:underline">Create your first ad!</Link></p>
            </div>
          )}

          {!authContextIsLoading && !adsAreLoading && ads.length > 0 && (
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

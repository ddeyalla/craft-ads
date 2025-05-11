'use client';

import { useState, createContext, useContext } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import AdGenerator from "@/components/dashboard/ad-generator";
import AdLibrary from "@/components/dashboard/ad-library";
import { toast } from "sonner";
import { Ad, AdStatus } from "@/types/ad";
import { AdApiResponse } from '@/components/dashboard/ad-generator';

// Define the type for an ad in progress
export type AdInProgress = {
  id: string;
  title: string;
  description: string;
  status: AdStatus;
};

// Create a context for managing ads in progress
type AdGenerationContextType = {
  adsInProgress: AdInProgress[];
  addSubmittedAd: (title: string, description: string) => string; // Returns the ad ID
  updateAdStatus: (id: string, status: AdStatus) => void;
  removeAdInProgress: (id: string) => void;
};

const AdGenerationContext = createContext<AdGenerationContextType>({
  adsInProgress: [],
  addSubmittedAd: () => '',
  updateAdStatus: () => {},
  removeAdInProgress: () => {},
});

export const useAdGeneration = () => useContext(AdGenerationContext);

export default function DashboardPage() {
  // State for ads in different stages of generation
  const [adsInProgress, setAdsInProgress] = useState<AdInProgress[]>([]);
  
  // Add a new ad in 'submitted' state
  const addSubmittedAd = (title: string, description: string) => {
    const id = `ad-${Date.now()}`;
    const newAd: AdInProgress = {
      id,
      title,
      description,
      status: 'submitted',
    };
    setAdsInProgress(prev => [newAd, ...prev]);
    return id;
  };
  
  // Update the status of an ad in progress
  const updateAdStatus = (id: string, status: AdStatus) => {
    setAdsInProgress(prev => 
      prev.map(ad => ad.id === id ? { ...ad, status } : ad)
    );
  };
  
  // Remove an ad from the in-progress list (e.g., when generation is complete)
  const removeAdInProgress = (id: string) => {
    setAdsInProgress(prev => prev.filter(ad => ad.id !== id));
  };
  return (
    <AdGenerationContext.Provider value={{ adsInProgress, addSubmittedAd, updateAdStatus, removeAdInProgress }}>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Fixed top nav */}
        <div className="sticky top-0 bg-background w-full">
          <div className="h-14 px-0">
            <Header title="Static ad generations" />
          </div>
        </div>
        
        <div className="flex flex-1 h-[calc(100vh-72px)]">
          {/* Main (scrollable) gallery section */}
          <div className="flex-1 overflow-y-auto p-5">
            <Tabs defaultValue="today">
              <TabsContent value="today">
                <AdLibrary adsInProgress={adsInProgress} />
              </TabsContent>
              <TabsContent value="previous">
                <div className="text-center py-8 text-muted-foreground">
                  No previous ads found
                </div>
              </TabsContent>
            </Tabs>
          </div>
          {/* Fixed ad form on the right */}
          <div className="hidden lg:block lg:w-[380px] shrink-0 border-l bg-background p-5 overflow-y-auto max-h-full">
            <AdGenerator onSuccess={(generatedAdFromApi: AdApiResponse) => {
              console.log('[StaticAdsPage] AdGenerator onSuccess, data from API:', generatedAdFromApi);
              
              // Construct the new Ad object for localStorage
              const newAdToStore: Ad = {
                id: generatedAdFromApi.id,
                adCopy: generatedAdFromApi.adCopy,          // Generated ad copy/headline
                productTitle: generatedAdFromApi.title,     // Original product title from API
                imageUrl: generatedAdFromApi.imageUrl,     
                status: 'generated',                       // Set status to generated
                user_id: generatedAdFromApi.user_id,       
                created_at: generatedAdFromApi.created_at, 
                updated_at: generatedAdFromApi.updated_at, 
              };

              try {
                const existingAdsString = localStorage.getItem('ads');
                const existingAds: Ad[] = existingAdsString ? JSON.parse(existingAdsString) : [];
                
                // Add the new ad (ensure no duplicates if re-processing, though API ID should be unique)
                const updatedAds = [newAdToStore, ...existingAds.filter(ad => ad.id !== newAdToStore.id)];
                localStorage.setItem('ads', JSON.stringify(updatedAds));
                
                console.log('[StaticAdsPage] New ad saved to localStorage. Total ads:', updatedAds.length);
                
                // Notify other components (like AdLibrary or Dashboard) that ads have been updated
                window.dispatchEvent(new CustomEvent('ads-updated'));
                
                toast.success("Ad created successfully!", {
                  description: "Your new ad has been generated and saved to your library.",
                });

                // Optionally, if you want to remove it from the 'inProgress' list managed by the context:
                // const adInProgressId = adsInProgress.find(ad => ad.title === generatedAdFromApi.title && ad.description === generatedAdFromApi.description)?.id;
                // if (adInProgressId) {
                //   removeAdInProgress(adInProgressId); // This might need adjustment if IDs don't match or multiple identical submissions are possible
                // }

              } catch (error) {
                console.error('[StaticAdsPage] Error saving new ad to localStorage:', error);
                toast.error('Failed to save ad to library', {
                  description: error instanceof Error ? error.message : 'Please check console for details.'
                });
              }
            }} />
          </div>
        </div>
      </div>
    </AdGenerationContext.Provider>
  );
}

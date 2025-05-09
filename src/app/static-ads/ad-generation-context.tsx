import { createContext, useContext, useState, ReactNode } from 'react';
import { AdStatus } from '@/components/dashboard/ad-card';

export type AdInProgress = {
  id: string;
  title: string;
  description: string;
  status: AdStatus;
};

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

export function AdGenerationProvider({ children }: { children: ReactNode }) {
  const [adsInProgress, setAdsInProgress] = useState<AdInProgress[]>([]);

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

  const updateAdStatus = (id: string, status: AdStatus) => {
    setAdsInProgress(prev =>
      prev.map(ad => (ad.id === id ? { ...ad, status } : ad))
    );
  };

  const removeAdInProgress = (id: string) => {
    setAdsInProgress(prev => prev.filter(ad => ad.id !== id));
  };

  return (
    <AdGenerationContext.Provider value={{
      adsInProgress,
      addSubmittedAd,
      updateAdStatus,
      removeAdInProgress,
    }}>
      {children}
    </AdGenerationContext.Provider>
  );
}

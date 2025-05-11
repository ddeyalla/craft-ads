export type AdStatus = 'submitted' | 'generating' | 'generated' | 'error'; 

export interface Ad {
  id: string;
  adCopy: string;        
  productTitle: string;  
  imageUrl: string;
  status: AdStatus;      
  created_at: string;
  updated_at: string;
  user_id?: string; // The Supabase user ID of the ad creator
}

// Type for ads that are currently in the process of being generated
export type AdInProgress = {
  id: string;         // Temporary or final ID for tracking
  title: string;      // Product title or headline being used for generation
  description: string; // Product description used for generation
  status: AdStatus;   // Current status of the generation process
};

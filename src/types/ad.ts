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

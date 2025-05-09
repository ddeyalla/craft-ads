export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  user_id?: string; // The Supabase user ID of the ad creator
}

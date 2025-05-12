'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductModal } from "@/lib/context/product-modal-context";
import { useState } from "react";
import { toast } from "sonner";
import { Globe, Loader2, PencilLine } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export default function ProductSourceStep() {
  const { state, setState, nextStep, setLoading, setError } = useProductModal();
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const { user } = useAuth();
  
  const handleSourceChange = (value: 'url' | 'manual') => {
    setState(prev => ({ ...prev, sourceType: value }));
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, productUrl: e.target.value }));
  };
  
  const handleFetchProductData = async () => {
    if (!user) {
      toast.error("User not authenticated. Please log in.");
      setIsScrapingLoading(false);
      setLoading(false);
      return;
    }

    if (!state.productUrl) {
      toast.error("Please enter a product URL");
      return;
    }
    
    try {
      setIsScrapingLoading(true);
      setLoading(true);
      
      // Validate URL
      try {
        new URL(state.productUrl);
      } catch (e) {
        toast.error("Please enter a valid URL");
        return;
      }
      
      // Call the scraping API
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: state.productUrl }),
        credentials: 'include', // Ensure cookies are sent for authentication
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch product data');
      }
      
      const data = await response.json();
      
      // Update form with scraped data
      setState(prev => ({
        ...prev,
        name: data.title || '',
        description: data.description || '',
        images: data.images || [],
        step: 2 // Move to next step
      }));
      
      toast.success("Product data fetched successfully!");
    } catch (error: any) {
      console.error('Error scraping product:', error);
      toast.error("Could not fetch product data. Please try manual entry.");
      setError(error.message || "Failed to fetch product data");
    } finally {
      setIsScrapingLoading(false);
      setLoading(false);
    }
  };
  
  const handleContinueToManual = () => {
    setState(prev => ({ ...prev, step: 2 }));
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium text-center mb-6">Product Source Step (Placeholder)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
        {/* URL Import Option */}
        <Button
          variant="outline"
          className={`h-auto py-6 px-4 flex flex-col items-center justify-center gap-3 ${state.sourceType === 'url' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => handleSourceChange('url')}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium">Import from URL</span>
        </Button>
        
        {/* Manual Entry Option */}
        <Button
          variant="outline"
          className={`h-auto py-6 px-4 flex flex-col items-center justify-center gap-3 ${state.sourceType === 'manual' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => handleSourceChange('manual')}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <PencilLine className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium">Enter Manually</span>
        </Button>
      </div>
      
      {/* URL Input - show when URL option is selected */}
      {state.sourceType === 'url' && (
        <div className="mt-6 space-y-4 max-w-xl mx-auto">
          <div className="space-y-2">
            <Label htmlFor="productUrl">Product URL</Label>
            <Input
              id="productUrl"
              placeholder="https://example.com/product-page"
              value={state.productUrl}
              onChange={handleUrlChange}
            />
          </div>
          
          <Button 
            onClick={handleFetchProductData} 
            disabled={isScrapingLoading || !state.productUrl}
            className="w-full"
          >
            {isScrapingLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Data...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      )}
      
      {/* Continue button for manual entry */}
      {state.sourceType === 'manual' && (
        <div className="mt-6 max-w-xl mx-auto">
          <Button 
            onClick={handleContinueToManual} 
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

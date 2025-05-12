'use client';

import { createContext, useContext, useState } from 'react';

export type ProductImage = {
  url: string;
  isPrimary: boolean;
  altText?: string;
  fileObj?: File; // For local file uploads
};

export type BrandFont = {
  type: 'google' | 'upload' | 'system';
  name?: string;
  url?: string;
};

export type ProductFormState = {
  step: number;
  sourceType: 'url' | 'manual' | null;
  productUrl: string;
  productType: 'physical' | 'digital' | 'service' | null;
  name: string;
  description: string;
  images: ProductImage[];
  brandColors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  brandFonts: {
    headline?: BrandFont;
    body?: BrandFont;
  };
  isLoading: boolean;
  error: string | null;
};

const initialState: ProductFormState = {
  step: 1,
  sourceType: null,
  productUrl: '',
  productType: null,
  name: '',
  description: '',
  images: [],
  brandColors: {},
  brandFonts: {},
  isLoading: false,
  error: null
};

type ProductModalContextType = {
  state: ProductFormState;
  setState: React.Dispatch<React.SetStateAction<ProductFormState>>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetForm: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateImages: (images: ProductImage[]) => void;
  setPrimaryImage: (index: number) => void;
};

const ProductModalContext = createContext<ProductModalContextType>({
  state: initialState,
  setState: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  resetForm: () => {},
  setLoading: () => {},
  setError: () => {},
  updateImages: () => {},
  setPrimaryImage: () => {}
});

export const ProductModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ProductFormState>(initialState);

  // Navigation helpers
  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  const goToStep = (step: number) => setState(prev => ({ ...prev, step }));
  const resetForm = () => setState(initialState);

  // Status helpers
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, isLoading: loading }));
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));

  // Image management
  const updateImages = (images: ProductImage[]) => setState(prev => ({ ...prev, images }));
  const setPrimaryImage = (index: number) => {
    setState(prev => {
      const updatedImages = prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      return { ...prev, images: updatedImages };
    });
  };

  return (
    <ProductModalContext.Provider 
      value={{ 
        state, 
        setState, 
        nextStep, 
        prevStep, 
        goToStep, 
        resetForm,
        setLoading,
        setError,
        updateImages,
        setPrimaryImage
      }}
    >
      {children}
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => useContext(ProductModalContext);

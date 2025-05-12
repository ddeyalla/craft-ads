'use client';

import { Button } from "@/components/ui/button";
import { useProductModal, BrandFont } from "@/lib/context/product-modal-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { HexColorPicker } from "react-colorful";
import { ArrowLeft, ArrowRight, Globe, Upload } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Sample system fonts
const SYSTEM_FONTS = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: "Times New Roman, serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Open Sans", value: "Open Sans, sans-serif" },
  { name: "Lato", value: "Lato, sans-serif" }
];

// Google Fonts (Popular)
const GOOGLE_FONTS = [
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Lato", value: "Lato" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Poppins", value: "Poppins" },
  { name: "Raleway", value: "Raleway" },
  { name: "Oswald", value: "Oswald" },
  { name: "Source Sans Pro", value: "Source Sans Pro" },
  { name: "Playfair Display", value: "Playfair Display" },
  { name: "Merriweather", value: "Merriweather" }
];

// Define form schema
const brandGuidelinesSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please provide a valid hex color",
  }).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please provide a valid hex color",
  }).optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Please provide a valid hex color",
  }).optional(),
  headlineFontType: z.enum(["system", "google", "upload"]).optional(),
  headlineFont: z.string().optional(),
  bodyFontType: z.enum(["system", "google", "upload"]).optional(),
  bodyFont: z.string().optional()
});

type BrandGuidelinesFormValues = z.infer<typeof brandGuidelinesSchema>;

export default function BrandGuidelinesStep() {
  const { state, setState, prevStep, nextStep } = useProductModal();
  const [activeColor, setActiveColor] = useState<'primary' | 'secondary' | 'accent' | null>(null);
  
  // Initialize form with values from context
  const form = useForm<BrandGuidelinesFormValues>({
    resolver: zodResolver(brandGuidelinesSchema),
    defaultValues: {
      primaryColor: state.brandColors.primary || '#3B82F6',
      secondaryColor: state.brandColors.secondary || '#10B981',
      accentColor: state.brandColors.accent || '#F59E0B',
      headlineFontType: state.brandFonts.headline?.type || 'system',
      headlineFont: state.brandFonts.headline?.name || 'Arial, sans-serif',
      bodyFontType: state.brandFonts.body?.type || 'system',
      bodyFont: state.brandFonts.body?.name || 'Arial, sans-serif'
    }
  });

  const onSubmit = (data: BrandGuidelinesFormValues) => {
    // Update brand colors in state
    setState(prev => ({
      ...prev,
      brandColors: {
        primary: data.primaryColor,
        secondary: data.secondaryColor,
        accent: data.accentColor
      },
      brandFonts: {
        headline: {
          type: data.headlineFontType || 'system',
          name: data.headlineFont
        },
        body: {
          type: data.bodyFontType || 'system',
          name: data.bodyFont
        }
      }
    }));

    // Move to next step
    nextStep();
  };

  // Handle back button
  const handleBack = () => {
    // Save current form values before going back
    const formValues = form.getValues();
    setState(prev => ({
      ...prev,
      brandColors: {
        primary: formValues.primaryColor,
        secondary: formValues.secondaryColor,
        accent: formValues.accentColor
      },
      brandFonts: {
        headline: {
          type: formValues.headlineFontType || 'system',
          name: formValues.headlineFont
        },
        body: {
          type: formValues.bodyFontType || 'system',
          name: formValues.bodyFont
        }
      }
    }));

    prevStep();
  };

  // Color picker helper
  const renderColorPicker = (fieldName: 'primaryColor' | 'secondaryColor' | 'accentColor', label: string) => {
    const colorKey = fieldName.replace('Color', '') as 'primary' | 'secondary' | 'accent';
    
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-md border cursor-pointer flex-shrink-0"
                style={{ backgroundColor: field.value || '#ffffff' }}
                onClick={() => setActiveColor(activeColor === colorKey ? null : colorKey)}
              />
              <FormControl>
                <Input
                  placeholder="#000000"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    // Update color preview in real-time
                    form.setValue(fieldName, e.target.value);
                  }}
                />
              </FormControl>
            </div>
            {activeColor === colorKey && (
              <div className="mt-2">
                <HexColorPicker
                  color={field.value || '#ffffff'}
                  onChange={(color) => {
                    field.onChange(color);
                    form.setValue(fieldName, color);
                  }}
                  className="w-full"
                />
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderFontSelector = (
    fontTypeField: 'headlineFontType' | 'bodyFontType',
    fontNameField: 'headlineFont' | 'bodyFont',
    label: string
  ) => {
    const fontType = form.watch(fontTypeField);
    
    return (
      <div className="space-y-4">
        <FormLabel>{label}</FormLabel>
        
        <Tabs 
          defaultValue={fontType || 'system'} 
          onValueChange={(val) => form.setValue(fontTypeField, val as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="system">System Font</TabsTrigger>
            <TabsTrigger value="google">Google Font</TabsTrigger>
            <TabsTrigger value="upload">Upload Font</TabsTrigger>
          </TabsList>
          
          {/* System Fonts */}
          <TabsContent value="system">
            <FormField
              control={form.control}
              name={fontNameField}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select system font" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_FONTS.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose from common system fonts that will be available on most devices
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Font Preview */}
            <div className="mt-4 p-4 border rounded-md">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <p 
                className="text-xl"
                style={{ fontFamily: form.watch(fontNameField) || 'sans-serif' }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </TabsContent>
          
          {/* Google Fonts */}
          <TabsContent value="google">
            <FormField
              control={form.control}
              name={fontNameField}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Google Font" />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOGLE_FONTS.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Google Fonts will be imported automatically in your ads
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Font Preview */}
            <div className="mt-4 p-4 border rounded-md">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <p 
                className="text-xl"
                style={{ fontFamily: form.watch(fontNameField) || 'sans-serif' }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </TabsContent>
          
          {/* Font Upload */}
          <TabsContent value="upload">
            <div className="border border-dashed rounded-md p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Upload Font Files</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Supported formats: .ttf, .woff, .woff2
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Select Font File
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Font upload feature will be available in the next release.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">Brand Guidelines</h3>
        <p className="text-muted-foreground mt-2">Customize colors and fonts for your product</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Colors Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium">Brand Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderColorPicker('primaryColor', 'Primary Color')}
              {renderColorPicker('secondaryColor', 'Secondary Color')}
              {renderColorPicker('accentColor', 'Accent Color')}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              These colors will be used in your ads and product listings
            </p>
          </div>

          {/* Fonts Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium">Brand Typography</h4>
            <div className="grid grid-cols-1 gap-8">
              {renderFontSelector('headlineFontType', 'headlineFont', 'Headline Font')}
              {renderFontSelector('bodyFontType', 'bodyFont', 'Body Font')}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="submit" className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

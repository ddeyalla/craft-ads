import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

const requestSchema = z.object({
  url: z.string().url(),
});

interface ProductSchema {
  '@context'?: string;
  '@type'?: string;
  name?: string;
  description?: string;
  image?: string | string[] | { '@type'?: string; url?: string }[];
  offers?: {
    '@type'?: string;
    price?: string;
    priceCurrency?: string;
    availability?: string;
  };
}

interface ExtractedProductData {
  title: string;
  description: string;
  images: { url: string; isPrimary: boolean; altText: string }[];
  jsonLd: ProductSchema | null;
}

export async function POST(request: Request) {
  // Debug: log all cookies received
  const rawCookieHeader = request.headers.get('cookie');
  console.log('API /scrape-product cookies:', rawCookieHeader);
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // console.warn('Failed to set cookie:', name, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // console.warn('Failed to remove cookie:', name, error);
          }
        },
      },
    }
  );

  try {
    console.log('[api/scrape-product] API route called');
    const body = await request.json();
    console.log('[api/scrape-product] Request body:', body);
    const { url: urlToScrape } = requestSchema.parse(body);
    console.log('[api/scrape-product] URL to scrape:', urlToScrape);

    console.log('[api/scrape-product] Getting authenticated user from Supabase');
    const authResponse = await supabase.auth.getUser();
    console.log('[api/scrape-product] Auth response:', JSON.stringify(authResponse));
    const { data: { user }, error: authError } = authResponse;

    if (authError || !user) {
      console.error('Authentication error:', authError?.message || 'User not found.');
      return NextResponse.json({ error: 'User not authenticated', details: authError?.message }, { status: 401 });
    }
    
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (!apiKey) {
      console.error('SCRAPINGBEE_API_KEY is not defined.');
      return NextResponse.json({ error: 'Scraping service API key is not configured.' }, { status: 500 });
    }

    console.log(`Scraping URL: ${urlToScrape} for user: ${user.id}`);

    const params = new URLSearchParams({
      api_key: apiKey,
      url: urlToScrape,
      render_js: 'true',
      premium_proxy: 'true',
    });

    const scrapingResponse = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
      method: 'GET',
    });

    if (!scrapingResponse.ok) {
      const errorText = await scrapingResponse.text();
      console.error(`ScrapingBee Error: Status ${scrapingResponse.status}, Text: ${errorText}`);
      return NextResponse.json({ error: `Failed to scrape: ${scrapingResponse.statusText}`, details: errorText }, { status: 502 });
    }

    const html = await scrapingResponse.text();
    const productData = extractProductData(html, urlToScrape);

    if (productData.title && productData.title.trim() !== '') {
      const productToSave = {
        user_id: user.id,
        // Add required product_type field (default to 'physical')
        product_type: 'physical',
        name: productData.title,
        url: urlToScrape,
        description: productData.description || 'No description available',
        // Convert images from array of URLs to proper format
        images: productData.images.map(img => ({
          url: img.url,
          isPrimary: img.isPrimary || false,
          altText: img.altText || productData.title || 'Product image'
        })),
        // Add required brand_colors field with defaults
        brand_colors: {
          primary: '#3B82F6',  // Default blue
          secondary: '#10B981', // Default green
          accent: '#F59E0B'     // Default amber
        },
        // Add required brand_fonts field with defaults
        brand_fonts: {
          headline: { type: 'system', name: 'Inter' },
          body: { type: 'system', name: 'Inter' }
        },
        // Make sure raw_scraped_data is properly formatted JSON
        raw_scraped_data: productData.jsonLd ? productData.jsonLd : {},
      };

      console.log('[api/scrape-product] Product data to save:', JSON.stringify(productToSave, null, 2));
      console.log('[api/scrape-product] Attempting to insert into products table');
      
      try {
        const { data: savedProduct, error: dbError } = await supabase
          .from('products')
          .insert(productToSave) // Changed from [productToSave] to productToSave (removed array wrapping)
          .select()
          .single();
        
        console.log('[api/scrape-product] Insert response - data:', savedProduct, 'error:', dbError);

        if (dbError) {
          console.error('[api/scrape-product] Error saving product to Supabase:', dbError.message, 'Complete error:', JSON.stringify(dbError));
          return NextResponse.json({ error: 'Failed to save product data', details: dbError.message }, { status: 500 });
        } else {
          console.log('[api/scrape-product] Product saved successfully to Supabase:', savedProduct?.id);
          return NextResponse.json(savedProduct || productData);
        }
      } catch (insertError: any) { // Add type annotation
        console.error('[api/scrape-product] Exception during insert operation:', insertError);
        return NextResponse.json({ error: 'Exception during insert', details: insertError.message }, { status: 500 });
      }
    } else {
      console.warn('Product not saved: Title is missing or empty after scraping.');
      return NextResponse.json({ ...productData, warning: 'Product data extracted, but not saved due to missing title.' }, {status: 200});
    }

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[api/scrape-product] Zod validation error:', error.errors);
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    console.error('[api/scrape-product] Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('[api/scrape-product] Error message:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('[api/scrape-product] Stack trace:', error.stack);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function extractProductData(html: string, pageUrl: string): ExtractedProductData {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Helper type predicate to check for non-empty strings
  const isNonEmptyString = (value: any): value is string => {
    return typeof value === 'string' && value.trim() !== '';
  };
  
  const domTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
              document.querySelector('h1')?.textContent ||
              document.title ||
              '';
  
  const domDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                   document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                   '';
  
  let titleToUse = domTitle; // Initialize with DOM title
  let descriptionToUse = domDescription; // Initialize with DOM description
  
  let jsonLdProductData: ProductSchema | null = null;
  const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
  scriptTags.forEach((script: Element) => {
    try {
      if (script.textContent) {
        const parsedData = JSON.parse(script.textContent);
        if (parsedData && typeof parsedData === 'object' && parsedData['@type'] === 'Product') {
          jsonLdProductData = parsedData as ProductSchema;
        }
      }
    } catch (e) { /* console.warn('Failed to parse JSON-LD script:', e); */ }
  });
  
  if (jsonLdProductData) {
    const { name: ldName, description: ldDesc } = jsonLdProductData;

    // Use ldName if it's a non-empty string and domTitle is effectively empty
    if (isNonEmptyString(ldName) && !isNonEmptyString(domTitle)) {
      titleToUse = ldName;
    }

    // Use ldDesc if it's a non-empty string and domDescription is effectively empty
    if (isNonEmptyString(ldDesc) && !isNonEmptyString(domDescription)) {
      descriptionToUse = ldDesc;
    }
  }
                    
  const images: { url: string; isPrimary: boolean; altText: string }[] = [];
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) {
    try {
        images.push({ 
            url: new URL(ogImage, pageUrl).href, 
            isPrimary: true, 
            altText: document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content') || titleToUse || 'Product image'
        });
    } catch (e) { /* console.warn('Invalid OG image URL:', ogImage) */ }
  }
  
  const productImagesElements = Array.from(document.querySelectorAll('img'))
    .filter((img: HTMLImageElement) => {
      const src = img.getAttribute('src');
      const width = parseInt(img.getAttribute('width') || img.naturalWidth.toString() || '0', 10);
      const height = parseInt(img.getAttribute('height') || img.naturalHeight.toString() || '0', 10);
      return src && !src.includes('icon') && !src.includes('logo') && !src.endsWith('.svg') && (width > 100 || height > 100);
    })
    .map((img: HTMLImageElement) => {
      const src = img.getAttribute('src') || '';
      let absoluteUrl = src;
      try {
        absoluteUrl = src.startsWith('http') ? src : new URL(src, pageUrl).href;
      } catch (e) { /* console.warn('Invalid image URL:', src); */ return null; }
      return { url: absoluteUrl, isPrimary: false, altText: img.getAttribute('alt') || titleToUse || 'Product image' };
    }).filter(img => img !== null) as { url: string; isPrimary: boolean; altText: string }[];
  
  const imageUrls = new Set(images.map(img => img.url));
  productImagesElements.forEach(img => {
    if (!imageUrls.has(img.url)) {
      images.push(img);
      imageUrls.add(img.url);
    }
  });
  
  const finalTitle: string = typeof titleToUse === 'string' ? titleToUse : '';
  const finalDescription: string = typeof descriptionToUse === 'string' ? descriptionToUse : '';

  return {
    title: finalTitle.trim(),
    description: finalDescription.trim(),
    images: images.slice(0, 5),
    jsonLd: jsonLdProductData,
  };
}

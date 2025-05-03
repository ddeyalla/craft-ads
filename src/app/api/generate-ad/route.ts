import { NextResponse, NextRequest } from 'next/server';
import OpenAI, { toFile } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Ensure the API key is available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}
// Ensure Supabase creds are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase Environment Variables');
}

// Define the bucket name for Supabase Storage
const BUCKET_NAME = 'generated-ads'; // IMPORTANT: Use the name of the bucket you created!

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, imageBase64, aspectRatio = '1:1' } = body;

    // Basic validation
    if (!title || !description || !imageBase64) {
      return NextResponse.json({ error: 'Missing required fields: title, description, or imageBase64' }, { status: 400 });
    }
    console.log('--- [/api/generate-ad] Received request ---');
    console.log('[Data Received] Title:', title);
    console.log('[Data Received] Description:', description.substring(0, 50) + '...');
    console.log('[Data Received] Image Base64 Start:', imageBase64.substring(0, 70) + '...');

    let researchSummary: string | null = null;
    try {
      // --- Step 1: Deep Research (GPT-4o mini with Vision) ---
      console.log('[Step 1] Starting Deep Research...');
      const researchResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a market research analyst. Analyze the provided product information (title, description, and image) to identify key features, target audience, unique selling points, and overall product vibe. Provide a concise summary.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Product Title: ${title}\n\nProduct Description: ${description}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64, // Send image as data URL
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      researchSummary = researchResponse.choices[0]?.message?.content?.trim() ?? null;
      if (!researchSummary) {
        throw new Error('OpenAI Research API returned empty content.');
      }
      console.log('[Step 1] Research Summary Generated:', researchSummary);
    } catch (error: any) {
      console.error('[API Step 1/2 Error] Failed during Deep Research:', error.message || error);
      throw new Error(`Research step failed: ${error.message}`);
    }

    let adCopy: string | null = null;
    try {
      // --- Step 2: Generate Ad Copy (GPT-4o mini) ---
      console.log('[Step 2] Starting Generate Ad Copy...');
      const adCopyResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: `
You are an expert 2025-era Advertising Creative Director, fusing **Nike’s visceral punch** with **Apple’s minimalist precision**.

PRIMARY DIRECTIVE

Transform each product brief into one ready-to-run image-generation prompt that:
• Keeps the PRODUCT in pristine hero focus (▸ **NO-MORPH**: no warping, stretching, or logo tampering).  
• Sparks a bold emotional payoff + clear benefit.  
• Overlays TWO text elements in safe zones without disrupting the composition.  


BUILD THE PROMPT IN 7-10 LINES

1. **Concept Sentence (1 line)** – Core feeling + key selling point.  
2. **Setting & Atmosphere** – Location, lighting, mood, color palette.  
3. **Subject Presentation** – Human action (if any), product placement, camera angle—product fully visible.  
4. **Typography & Branding (dual placement)** –  
   • **Headline (top-center):** Write exact hook in *quotation marks*; place inside the **upper 20 % height × center 70 % width** safe area, ≥5 % margin from edges. Bold sans-serif.  
   • **Tagline + logo (bottom-center):** Write brand tag in *quotation marks*; note “logo lock-up to the left of text.” Place inside the **lower 20 % height × center 70 % width** safe area, same margin rules.  
5. **Optional brand-color accents** – mention subtle integration that complements scene.  
6. End with **ONE Style Reference Tag**:  
   [NIKE INSPIRE] | [APPLE MINIMAL] | [VINTAGE AD] | [LIFESTYLE AUTHENTIC] | [LUXURY ELEGANT] | [BOLD GRAPHIC]


TONE & FORMAT RULES
• 7-10 sentences total, vivid but concise.  
• No meta comments—output must be a final prompt.  
• Always embed both text strings with exact safe-area placement cues.  
`
          },
          {
            role: 'user',
            content: `Product Title: ${title}\nProduct Description: ${description}\n\nResearch Summary:\n${researchSummary}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      adCopy = adCopyResponse.choices[0]?.message?.content?.trim() ?? null;
      if (!adCopy) {
        throw new Error('OpenAI Ad Copy API returned empty content.');
      }
      console.log('[Step 2] Ad Copy Generated:', adCopy);
    } catch (error: any) {
      console.error('[API Step 1/2 Error] Failed during Ad Copy Generation:', error.message || error);
      throw new Error(`Ad Copy step failed: ${error.message}`);
    }

    let finalImageUrl: string | null = null;
    try {
      // --- Step 3: Process Uploaded Image & Edit with OpenAI ---
      console.log('[Step 3] Processing uploaded image for OpenAI Edit API...');

      // Extract MIME type and Base64 data
      const match = imageBase64.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
      if (!match || match.length !== 3) {
        throw new Error('Invalid or unsupported image format received (must be png, jpeg, or webp).');
      }
      const originalMimeType = match[1]; // e.g., 'image/jpeg'
      const base64Data = match[2];
      console.log(`[Step 3] Original image type: ${originalMimeType}. Decoding Base64.`);

      // Decode Base64 to initial buffer
      let initialBuffer = Buffer.from(base64Data, 'base64');
      let bufferForOpenAI: Buffer;
      const requiredMimeTypeForOpenAI = 'image/png'; // API requires PNG

      // Convert to PNG using sharp if the original image is not PNG
      if (originalMimeType !== requiredMimeTypeForOpenAI) {
        console.log(`[Step 3] Converting ${originalMimeType} to PNG using sharp...`);
        try {
          bufferForOpenAI = await sharp(initialBuffer).png().toBuffer();
          console.log('[Step 3] Conversion to PNG successful.');
        } catch (conversionError: any) {
          console.error('[Step 3 Error] Sharp PNG conversion failed:', conversionError);
          throw new Error(`Failed to convert uploaded image to PNG: ${conversionError.message}`);
        }
      } else {
        console.log('[Step 3] Image is already PNG, no conversion needed.');
        bufferForOpenAI = initialBuffer; // Use the original buffer directly
      }

      // Prepare the (potentially converted) PNG buffer as an Uploadable file for the API
      console.log('[Step 3] Preparing final PNG buffer for OpenAI API...');
      const uploadableImage = await toFile(
        bufferForOpenAI,           // Use the PNG buffer
        `input_image.png`,         // Name the file as .png
        { type: requiredMimeTypeForOpenAI } // Explicitly set type to image/png
      );

      console.log('[Step 3] Calling OpenAI images.edit with PNG image...');
      
      // Map aspect ratio to OpenAI size parameter
      let imageSize: '1024x1024' | '1536x1024' | '1024x1536';
      switch (aspectRatio) {
        case '16:9':
          imageSize = '1536x1024';
          break;
        case '9:16':
          imageSize = '1024x1536';
          break;
        default:
          imageSize = '1024x1024'; // Default to 1:1
      }
      
      console.log(`[Step 3] Using image size: ${imageSize} for aspect ratio: ${aspectRatio}`);
      
      const imageEditResponse = await openai.images.edit({
        model: 'gpt-image-1',      // Keeping user's reverted model choice
        image: uploadableImage,      // Pass the PNG uploadable
        prompt: adCopy,
        n: 1,
        size: imageSize,
        quality: 'high',
      });

      const responseData = imageEditResponse.data?.[0];
      const editedB64Json = responseData?.b64_json;

      if (!editedB64Json) {
        console.error('[Step 3 Error] OpenAI Image Edit API response data missing b64_json:', imageEditResponse);
        throw new Error('OpenAI Image Edit API returned no b64_json data.');
      }
      console.log('[Step 3] Received edited image b64_json from OpenAI.');

      // --- Step 4: Upload edited image to Supabase Storage ---
      console.log('[Step 4] Uploading edited image to Supabase Storage...');
      const editedImageBuffer = Buffer.from(editedB64Json, 'base64');
      const fileName = `ad-image-${uuidv4()}.png`; // Generate unique filename, assume PNG output from edit API
      const filePath = `public/${fileName}`; // Store in a 'public' folder within the bucket

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, editedImageBuffer, {
          contentType: 'image/png', // Assuming edit API returns PNG
          cacheControl: '3600', // Optional: Cache control
          upsert: false, // Don't overwrite existing files (though filename is unique)
        });

      if (uploadError) {
        console.error('[Step 4 Error] Supabase upload failed:', uploadError);
        throw new Error(`Failed to upload image to Supabase Storage: ${uploadError.message}`);
      }

      console.log('[Step 4] Image uploaded successfully to Supabase path:', uploadData?.path);

      // --- Step 5: Get Public URL from Supabase ---
      console.log('[Step 5] Getting public URL from Supabase...');
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        console.error('[Step 5 Error] Could not get public URL from Supabase.');
        // Optionally: attempt to delete the uploaded file if URL retrieval fails?
        throw new Error('Image uploaded but failed to retrieve public URL from Supabase.');
      }

      finalImageUrl = urlData.publicUrl;
      console.log('[Step 5] Supabase Public URL Generated:', finalImageUrl);

    } catch (error: any) {
      console.error('[API Step 3/4/5 Error] Failed during Image Processing/Edit/Upload/URL Retrieval:', error.message || error);
      throw new Error(`Image processing/storage failed: ${error.message}`);
    }

    // --- Return final result ---
    const responsePayload = { adCopy, imageUrl: finalImageUrl };
    console.log('[API Success] Preparing final response payload:', {
      adCopy: responsePayload.adCopy,
      imageUrl: responsePayload.imageUrl ? responsePayload.imageUrl.substring(0, 100) + '...' : 'null'
    });
    return NextResponse.json(responsePayload);

  } catch (error: any) {
    // Catch overarching errors (e.g., failed JSON parsing, Step 1/2 errors)
    console.error('[API Overall Error] Error caught in main handler:', error.message || error);
    // console.error(error); // Log full error object if needed
    return NextResponse.json({ error: `Ad generation failed: ${error.message}` }, { status: 500 });
  }
}

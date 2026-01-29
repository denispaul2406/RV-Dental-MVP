import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { calculateANB, calculateOverjet, Point } from "@/lib/geometry";
import { getMockScaledFeatures, getMockSuitabilityFromModels } from "@/lib/mlModels";
import sharp from "sharp";

// Model fallback chain: Try best model first, fallback to alternatives
const MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
];

interface LandmarkData {
    landmarks: {
        Sella?: [number, number] | { x: number; y: number };
        Nasion?: [number, number] | { x: number; y: number };
        "Point A"?: [number, number] | { x: number; y: number };
        "Point B"?: [number, number] | { x: number; y: number };
        S?: [number, number] | { x: number; y: number };
        N?: [number, number] | { x: number; y: number };
        A?: [number, number] | { x: number; y: number };
        B?: [number, number] | { x: number; y: number };
    };
    calculations?: {
        ANB_Angle?: number;
        Overjet_mm?: number;
    };
}

// Convert various coordinate formats to normalized {x, y}
function normalizeLandmark(
    landmark: [number, number] | { x: number; y: number } | undefined,
    imageWidth: number,
    imageHeight: number,
    landmarkName: string
): Point | null {
    if (!landmark) return null;

    let x: number, y: number;

    if (Array.isArray(landmark)) {
        [x, y] = landmark;
    } else {
        x = landmark.x;
        y = landmark.y;
    }

    // Log raw coordinates from Gemini for debugging
    console.log(`[${landmarkName}] Raw coordinates from Gemini: [${x}, ${y}], Image size: ${imageWidth}x${imageHeight}`);

    // Clamp coordinates to image bounds to prevent out-of-bounds plotting
    let clampedX = x;
    let clampedY = y;
    let wasClamped = false;

    if (x < 0) {
        clampedX = 0;
        wasClamped = true;
        console.warn(`[${landmarkName}] X coordinate ${x} is negative, clamping to 0`);
    } else if (x > imageWidth) {
        clampedX = imageWidth;
        wasClamped = true;
        console.warn(`[${landmarkName}] X coordinate ${x} exceeds image width ${imageWidth}, clamping to ${imageWidth}`);
    }

    if (y < 0) {
        clampedY = 0;
        wasClamped = true;
        console.warn(`[${landmarkName}] Y coordinate ${y} is negative, clamping to 0`);
    } else if (y > imageHeight) {
        clampedY = imageHeight;
        wasClamped = true;
        console.warn(`[${landmarkName}] Y coordinate ${y} exceeds image height ${imageHeight}, clamping to ${imageHeight}`);
    }

    if (wasClamped) {
        console.warn(`[${landmarkName}] Coordinates were clamped from [${x}, ${y}] to [${clampedX}, ${clampedY}]`);
    }

    // Determine if coordinates are normalized or pixels
    // If coordinates are > image dimensions, they're definitely pixels
    // If coordinates are <= 100 AND image is > 100px, they might be normalized
    // But to be safe, we'll check: if coordinates are reasonable pixel values (> 100) or 
    // if they're clearly normalized (0-100 range AND image is large)
    const isLikelyNormalized = (clampedX >= 0 && clampedX <= 100 && clampedY >= 0 && clampedY <= 100) && 
                                (imageWidth > 200 || imageHeight > 200); // Only trust normalization if image is large
    
    if (isLikelyNormalized) {
        console.log(`[${landmarkName}] Treating as normalized coordinates: [${clampedX}%, ${clampedY}%]`);
        return { x: clampedX, y: clampedY };
    }

    // Convert pixel coordinates to normalized (0-100)
    const normalized = {
        x: (clampedX / imageWidth) * 100,
        y: (clampedY / imageHeight) * 100
    };
    console.log(`[${landmarkName}] Converted from pixels to normalized: [${normalized.x.toFixed(2)}%, ${normalized.y.toFixed(2)}%]`);
    
    return normalized;
}

async function analyzeWithModel(
    genAI: GoogleGenerativeAI,
    modelName: string,
    base64Image: string,
    mimeType: string,
    imageWidth: number,
    imageHeight: number
): Promise<{ landmarks: Record<string, Point>; anb: number; overjet: number } | null> {
    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.0,
                responseMimeType: "application/json",
            }
        });

        const prompt = `Analyze this lateral cephalogram for orthodontic case selection.

**CRITICAL: Image Dimensions**
The image dimensions are: ${imageWidth} pixels wide × ${imageHeight} pixels tall.
ALL coordinates MUST be within these bounds: x must be between 0 and ${imageWidth}, y must be between 0 and ${imageHeight}.

**Landmark Definitions:**
1. **Sella (S)**: The geometric center of the sella turcica (the saddle-shaped depression in the sphenoid bone).
2. **Nasion (N)**: The most anterior point of the frontonasal suture in the midsagittal plane.
3. **Point A (Subspinale)**: The deepest midline point on the anterior curvature of the maxilla, between the anterior nasal spine (ANS) and prosthion (the most anterior point of the alveolar process of the maxilla).
4. **Point B (Supramentale)**: The deepest midline point on the anterior curvature of the mandible, between infradentale (the most superior point of the alveolar process of the mandible) and pogonion (the most anterior point of the chin).

**Instructions:**
1. Identify the exact pixel coordinates [x, y] for each landmark. Coordinates MUST be within image bounds (0 to ${imageWidth} for x, 0 to ${imageHeight} for y).
2. Calculate the ANB Angle in degrees and Overjet in mm.
3. Based on the Research Criteria (ANB > 4.5°, Overjet > 5mm, age 9-15 years), determine if this patient is an ideal candidate for functional appliance therapy.

**Coordinate System:**
- Origin (0,0) is at the TOP-LEFT corner of the image
- X increases from left to right (0 to ${imageWidth})
- Y increases from top to bottom (0 to ${imageHeight})
- All coordinates must be integers representing pixel positions

Return the response in JSON format:
{
  "landmarks": {
    "Sella": [x, y],
    "Nasion": [x, y],
    "Point A": [x, y],
    "Point B": [x, y]
  },
  "calculations": {
    "ANB_Angle": number,
    "Overjet_mm": number
  },
  "functional_appliance_candidacy": {
    "is_ideal_candidate": boolean,
    "notes": "string"
  }
}`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();

        // Clean up JSON if wrapped in markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }

        const data: LandmarkData = JSON.parse(text);

        // Extract landmarks with fallback to alternative naming
        const landmarks: Record<string, Point> = {};
        
        console.log("Raw Gemini response:", JSON.stringify(data, null, 2));
        
        const sella = normalizeLandmark(
            data.landmarks.Sella || data.landmarks.S,
            imageWidth,
            imageHeight,
            "Sella"
        );
        const nasion = normalizeLandmark(
            data.landmarks.Nasion || data.landmarks.N,
            imageWidth,
            imageHeight,
            "Nasion"
        );
        const pointA = normalizeLandmark(
            data.landmarks["Point A"] || data.landmarks.A,
            imageWidth,
            imageHeight,
            "Point A"
        );
        const pointB = normalizeLandmark(
            data.landmarks["Point B"] || data.landmarks.B,
            imageWidth,
            imageHeight,
            "Point B"
        );

        if (!sella || !nasion || !pointA || !pointB) {
            throw new Error("Missing landmarks in response");
        }

        landmarks.S = sella;
        landmarks.N = nasion;
        landmarks.A = pointA;
        landmarks.B = pointB;

        // Get calculations from model or compute
        let anb = data.calculations?.ANB_Angle;
        let overjet = data.calculations?.Overjet_mm;

        // Fallback: Calculate ANB if not provided
        if (anb === undefined) {
            anb = calculateANB(sella, nasion, pointA, pointB);
        }

        // Fallback: Calculate Overjet if not provided
        // Note: Real overjet requires dental landmarks, this is an approximation
        if (overjet === undefined || overjet === null) {
            // Use a rough estimate based on horizontal distance
            // In normalized coordinates, approximate conversion
            const horizontalDist = Math.abs(pointA.x - pointB.x);
            // Rough calibration: assuming image is ~200mm wide, 1% = 2mm
            overjet = horizontalDist * 2;
        }

        const analysisResult = {
            landmarks,
            anb: parseFloat(anb.toFixed(2)),
            overjet: parseFloat(overjet.toFixed(2))
        };
        
        console.log("Final normalized landmarks:", JSON.stringify(analysisResult.landmarks, null, 2));
        
        return analysisResult;
    } catch (error) {
        console.error(`Model ${modelName} failed:`, error);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const imageBuffer = Buffer.from(buffer);
        const base64Image = imageBuffer.toString("base64");

        // Get actual image dimensions using Sharp
        let imageWidth = 800; // Fallback width
        let imageHeight = 1000; // Fallback height
        
        try {
            const metadata = await sharp(imageBuffer).metadata();
            if (metadata.width && metadata.height) {
                imageWidth = metadata.width;
                imageHeight = metadata.height;
                console.log(`Image dimensions detected: ${imageWidth}x${imageHeight}`);
            }
        } catch (error) {
            console.warn("Failed to get image dimensions, using fallback:", error);
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY not configured. Please set up your API key." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Try models in order until one succeeds
        let result = null;
        let lastError: Error | null = null;

        for (const modelName of MODEL_CHAIN) {
            try {
                result = await analyzeWithModel(
                    genAI,
                    modelName,
                    base64Image,
                    file.type || "image/jpeg",
                    imageWidth,
                    imageHeight
                );
                if (result) {
                    console.log(`Successfully used model: ${modelName}`);
                    break;
                }
            } catch (error) {
                lastError = error as Error;
                console.warn(`Model ${modelName} failed, trying next...`);
                continue;
            }
        }

        if (!result) {
            throw lastError || new Error("All models failed");
        }

        const { landmarks, anb, overjet } = result;

        // Determine suitability based on criteria (Gemini + app logic)
        const isSuitable = anb > 4.5 && overjet > 5.0;

        // Mock: reference data-model/ ML assets (not loaded; for documentation only)
        void getMockScaledFeatures([anb, overjet]);
        void getMockSuitabilityFromModels([]);

        return NextResponse.json({
            landmarks,
            analysis: {
                anb,
                overjet,
                suitable: isSuitable,
                message: isSuitable
                    ? "Functional Appliance Therapy Recommended"
                    : "Routine Observation"
            }
        });

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        // Return error instead of mock data - only use Gemini's response
        return NextResponse.json(
            { 
                error: "AI analysis failed. Please try again.",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

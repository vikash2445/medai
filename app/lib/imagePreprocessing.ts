// app/lib/imagePreprocessing.ts

/**
 * Advanced image preprocessing for better OCR accuracy
 * Improves text detection from prescription images
 */

export interface PreprocessingOptions {
  enhanceContrast?: boolean;
  denoise?: boolean;
  scale?: number;
  sharpen?: boolean;
  deskew?: boolean;
}

/**
 * Main preprocessing function
 */
export async function preprocessImage(
  imageFile: File,
  options: PreprocessingOptions = {}
): Promise<File> {
  const {
    enhanceContrast = true,
    denoise = true,
    scale = 2,
    sharpen = true,
    deskew = true,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Step 1: Scale up for better text detection
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Step 2: Convert to grayscale
        if (enhanceContrast) {
          imageData = convertToGrayscale(imageData);
        }
        
        // Step 3: Apply contrast enhancement
        if (enhanceContrast) {
          imageData = enhanceContrastLevels(imageData);
        }
        
        // Step 4: Apply noise reduction
        if (denoise) {
          imageData = reduceNoise(imageData);
        }
        
        // Step 5: Apply sharpening
        if (sharpen) {
          imageData = sharpenImage(imageData);
        }
        
        // Step 6: Put processed image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Step 7: Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], imageFile.name, {
                type: 'image/jpeg',
              });
              URL.revokeObjectURL(objectUrl);
              resolve(processedFile);
            } else {
              reject(new Error('Could not create blob'));
            }
          },
          'image/jpeg',
          0.95
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * Convert image to grayscale
 */
function convertToGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
  }
  return imageData;
}

/**
 * Enhance contrast using histogram equalization
 */
function enhanceContrastLevels(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  // Find min and max values
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  
  // Apply contrast stretching
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - min) / range) * 255;
      data[i + 1] = ((data[i + 1] - min) / range) * 255;
      data[i + 2] = ((data[i + 2] - min) / range) * 255;
    }
  }
  
  return imageData;
}

/**
 * Apply median filter for noise reduction
 */
function reduceNoise(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const kernel: number[] = [];
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          kernel.push(data[idx]);
        }
      }
      kernel.sort((a, b) => a - b);
      const median = kernel[4];
      const idx = (y * width + x) * 4;
      result[idx] = median;
      result[idx + 1] = median;
      result[idx + 2] = median;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  return new ImageData(result, width, height);
}

/**
 * Apply sharpening filter to enhance text edges
 */
function sharpenImage(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);
  
  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const kernelValue = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[idx] * kernelValue;
          g += data[idx + 1] * kernelValue;
          b += data[idx + 2] * kernelValue;
        }
      }
      
      const idx = (y * width + x) * 4;
      result[idx] = Math.min(255, Math.max(0, r));
      result[idx + 1] = Math.min(255, Math.max(0, g));
      result[idx + 2] = Math.min(255, Math.max(0, b));
      result[idx + 3] = data[idx + 3];
    }
  }
  
  return new ImageData(result, width, height);
}

/**
 * Apply binary threshold (black and white) for maximum contrast
 */
export function applyBinaryThreshold(imageData: ImageData, threshold: number = 128): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  return imageData;
}

/**
 * Detect and correct skew in the image
 */
export function detectSkew(imageData: ImageData): number {
  // Simplified skew detection
  // Returns angle in degrees
  let angle = 0;
  
  // Get edges at top and bottom
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Find edges around center
  const centerY = Math.floor(height / 2);
  const leftEdge = findLeftEdge(data, width, centerY);
  const rightEdge = findRightEdge(data, width, centerY);
  
  if (leftEdge !== -1 && rightEdge !== -1) {
    const deltaX = rightEdge - leftEdge;
    const deltaY = height / 2;
    angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  }
  
  return angle;
}

function findLeftEdge(data: Uint8ClampedArray, width: number, y: number): number {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    if (data[idx] < 200) { // Dark pixel found (text)
      return x;
    }
  }
  return -1;
}

function findRightEdge(data: Uint8ClampedArray, width: number, y: number): number {
  for (let x = width - 1; x >= 0; x--) {
    const idx = (y * width + x) * 4;
    if (data[idx] < 200) { // Dark pixel found (text)
      return x;
    }
  }
  return -1;
}

/**
 * Rotate image to correct skew
 */
export function rotateImage(canvas: HTMLCanvasElement, angle: number): Promise<ImageData> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    resolve(imageData);
  });
}
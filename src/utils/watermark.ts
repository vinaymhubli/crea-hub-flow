/**
 * Watermark utility for files
 * Adds diagonal watermark text to files before final files (Fiverr-style)
 */

/**
 * Checks if a file is an image based on its type
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/');
}

/**
 * Checks if a file is a PDF based on its type or extension
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Adds diagonal watermark to an image file (Fiverr-style)
 * Large diagonal text from top-left to bottom-right
 * @param file - The image file to watermark
 * @param watermarkText - Text to use as watermark (default: "Meetmydesigners")
 * @returns Promise<Blob> - The watermarked image as a Blob
 */
export async function addWatermarkToImage(
  file: File,
  watermarkText: string = "Meetmydesigners"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Add diagonal watermark (Fiverr-style: big diagonal text from top-left to bottom-right)
      ctx.save();
      
      // Calculate diagonal distance for proper sizing
      const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      
      // Large font size - 12-15% of diagonal for prominent watermark (like Fiverr)
      const fontSize = Math.max(
        diagonal * 0.12, 
        Math.max(canvas.width, canvas.height) * 0.18
      );
      
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate diagonal angle (45 degrees from top-left to bottom-right)
      const angle = Math.PI / 4; // 45 degrees
      
      // Position: Center of canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Rotate context for diagonal text (45 degrees)
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // Draw large diagonal watermark in center (main watermark)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // Semi-transparent black
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Semi-transparent white outline
      ctx.lineWidth = fontSize * 0.08;
      
      // Draw main watermark with outline
      ctx.strokeText(watermarkText, 0, 0);
      ctx.fillText(watermarkText, 0, 0);

      // Draw additional diagonal watermarks across the entire image (like Fiverr pattern)
      ctx.globalAlpha = 0.2; // More transparent for repeated watermarks
      ctx.lineWidth = fontSize * 0.06; // Thinner outline for repeated watermarks
      
      // Spacing between watermarks - calculated to cover entire diagonal
      const spacing = diagonal * 0.35;
      const offsetX = -diagonal / 2;
      
      // Draw pattern of diagonal watermarks from top-left to bottom-right
      // This ensures coverage across the entire image
      for (let i = -3; i <= 3; i++) {
        for (let j = -2; j <= 2; j++) {
          if (i === 0 && j === 0) continue; // Skip center (already drawn)
          const x = offsetX + i * spacing;
          const y = j * spacing * 0.5;
          ctx.strokeText(watermarkText, x, y);
          ctx.fillText(watermarkText, x, y);
        }
      }

      ctx.restore();

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type || 'image/png',
        0.95 // High quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Converts PDF first page to image and adds watermark
 * Note: This is a simplified approach - for full PDF watermarking, server-side processing is recommended
 */
async function watermarkPdfFirstPage(file: File, watermarkText: string): Promise<File> {
  // For now, return original PDF as client-side PDF watermarking is complex
  // In production, you'd use pdf-lib or server-side processing
  console.warn('PDF watermarking requires server-side processing. Returning original file.');
  return file;
}

/**
 * Processes a file and adds watermark
 * For images: Adds diagonal watermark (Fiverr-style)
 * For other files: Returns original (server-side processing recommended for PDFs, etc.)
 * @param file - The file to process
 * @param watermarkText - Text to use as watermark (default: "Meetmydesigners")
 * @returns Promise<File> - The processed file (watermarked if image, original otherwise)
 */
export async function processFileWithWatermark(
  file: File,
  watermarkText: string = "Meetmydesigners"
): Promise<File> {
  // Watermark images
  if (isImageFile(file.type)) {
    try {
      const watermarkedBlob = await addWatermarkToImage(file, watermarkText);
      
      // Create a new File from the blob with the same name
      const watermarkedFile = new File(
        [watermarkedBlob],
        file.name,
        {
          type: file.type,
          lastModified: Date.now()
        }
      );

      return watermarkedFile;
    } catch (error) {
      console.error('Error adding watermark to image:', error);
      // Return original file if watermarking fails
      return file;
    }
  }
  
  // For PDFs, attempt to watermark (simplified - returns original for now)
  if (isPdfFile(file)) {
    try {
      return await watermarkPdfFirstPage(file, watermarkText);
    } catch (error) {
      console.error('Error processing PDF:', error);
      return file;
    }
  }

  // For other file types, return original
  // Note: For full watermarking support, server-side processing is recommended
  console.warn(`File type ${file.type} not supported for watermarking. Returning original file.`);
  return file;
}

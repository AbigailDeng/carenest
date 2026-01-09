/**
 * File upload and processing service
 * Handles text, image, and PDF file uploads with extraction
 */

export interface FileUploadResult {
  content: string;
  fileType: 'text' | 'image' | 'pdf';
  filename: string;
  fileSize: number;
  arrayBuffer: ArrayBuffer;
}

export interface OCRProgress {
  progress: number;
  status: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload and process a file
 * @param file - File to upload
 * @param onOCRProgress - Optional callback for OCR progress updates
 */
export async function uploadFile(
  file: File,
  onOCRProgress?: (progress: OCRProgress) => void
): Promise<FileUploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Please use a smaller file.`);
  }

  // Determine file type
  const fileType = determineFileType(file);
  
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Extract text content based on file type
  let content: string;
  
  switch (fileType) {
    case 'text':
      content = await extractTextFromTextFile(arrayBuffer);
      break;
    case 'image':
      content = await extractTextFromImage(arrayBuffer, onOCRProgress);
      break;
    case 'pdf':
      content = await extractTextFromPDF(arrayBuffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${file.type}`);
  }

  return {
    content,
    fileType,
    filename: file.name,
    fileSize: file.size,
    arrayBuffer,
  };
}

/**
 * Determine file type from file
 */
function determineFileType(file: File): 'text' | 'image' | 'pdf' {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  }

  if (mimeType.startsWith('text/') || ['txt', 'md', 'csv'].includes(extension || '')) {
    return 'text';
  }

  // Default to text for unknown types
  return 'text';
}

/**
 * Extract text from text file
 */
async function extractTextFromTextFile(arrayBuffer: ArrayBuffer): Promise<string> {
  const decoder = new TextDecoder('utf-8');
  try {
    return decoder.decode(arrayBuffer);
  } catch {
    // Try with different encodings
    return new TextDecoder('latin1').decode(arrayBuffer);
  }
}

/**
 * Extract text from image using OCR (Tesseract.js)
 * @param arrayBuffer - Image file as ArrayBuffer
 * @param onProgress - Optional callback for OCR progress updates
 */
async function extractTextFromImage(
  arrayBuffer: ArrayBuffer,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  try {
    // Dynamic import of Tesseract.js to avoid bundling issues
    const Tesseract = await import('tesseract.js');
    
    // Convert ArrayBuffer to ImageData or Blob
    const blob = new Blob([arrayBuffer]);
    const imageUrl = URL.createObjectURL(blob);
    
    try {
      // Perform OCR with progress tracking
      // Using 'chi_sim+eng' for Chinese Simplified + English support
      // You can change to 'eng' for English only, or 'chi_tra+eng' for Traditional Chinese
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'chi_sim+eng', {
        logger: (m) => {
          // Report progress if callback provided
          if (onProgress) {
            const progressPercent = m.progress ? Math.round(m.progress * 100) : 0;
            onProgress({
              progress: progressPercent,
              status: m.status || 'processing',
            });
          }
          
          // Log progress for debugging
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      
      // Clean up the object URL
      URL.revokeObjectURL(imageUrl);
      
      // Return extracted text, or a message if no text was found
      const cleanedText = text.trim();
      if (cleanedText.length === 0) {
        return '[图片已上传，但未能识别出文字内容。请确保图片清晰且包含可读的文字。]';
      }
      
      return cleanedText;
    } catch (ocrError: any) {
      URL.revokeObjectURL(imageUrl);
      throw new Error(`OCR识别失败: ${ocrError.message || '未知错误'}`);
    }
  } catch (importError: any) {
    // If Tesseract.js is not available, provide helpful error message
    throw new Error('OCR功能需要安装tesseract.js库。请运行: npm install tesseract.js');
  }
}

/**
 * Extract text from PDF using PDF.js
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Dynamic import of PDF.js to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source (for web workers)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim() || '[PDF file uploaded. Text extraction may require additional processing.]';
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size === 0) {
    return { valid: false, error: 'File is empty. Please select a valid file.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Please use a smaller file.`,
    };
  }

  const fileType = determineFileType(file);
  if (!['text', 'image', 'pdf'].includes(fileType)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a text file, image, or PDF.',
    };
  }

  return { valid: true };
}


/**
 * 이미지 압축 및 리사이즈 유틸리티
 */

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number; // bytes
}

const DEFAULT_OPTIONS: Required<ImageResizeOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxFileSize: 2 * 1024 * 1024, // 2MB
};

/**
 * 이미지 파일을 압축하고 리사이즈합니다
 */
export async function compressImage(
  file: File,
  options: ImageResizeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // 원본 크기
      const { width: originalWidth, height: originalHeight } = img;
      
      // 비율 유지하면서 최대 크기 계산
      const ratio = Math.min(
        opts.maxWidth / originalWidth,
        opts.maxHeight / originalHeight,
        1 // 확대는 하지 않음
      );
      
      const newWidth = Math.round(originalWidth * ratio);
      const newHeight = Math.round(originalHeight * ratio);
      
      // 캔버스 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // WebP로 변환 (더 효율적인 압축)
      let quality = opts.quality;
      let result: string;
      
      // WebP 지원 여부 확인
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
      
      if (supportsWebP) {
        result = canvas.toDataURL('image/webp', quality);
        
        // 파일 크기가 너무 크면 품질을 낮춰서 다시 시도
        while (getBase64Size(result) > opts.maxFileSize && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/webp', quality);
        }
      } else {
        // WebP를 지원하지 않으면 JPEG 사용
        result = canvas.toDataURL('image/jpeg', quality);
        
        while (getBase64Size(result) > opts.maxFileSize && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
      }
      
      // 그래도 크면 크기를 더 줄임
      if (getBase64Size(result) > opts.maxFileSize) {
        const smallerRatio = Math.sqrt(opts.maxFileSize / getBase64Size(result));
        const smallerWidth = Math.round(newWidth * smallerRatio);
        const smallerHeight = Math.round(newHeight * smallerRatio);
        
        canvas.width = smallerWidth;
        canvas.height = smallerHeight;
        ctx.drawImage(img, 0, 0, smallerWidth, smallerHeight);
        result = supportsWebP ? canvas.toDataURL('image/webp', 0.7) : canvas.toDataURL('image/jpeg', 0.7);
      }
      
      resolve(result);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // 파일을 이미지로 로드
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * base64 문자열의 바이트 크기 계산
 */
function getBase64Size(base64: string): number {
  const base64Data = base64.split(',')[1] || base64;
  return Math.round((base64Data.length * 3) / 4);
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 이미지가 압축이 필요한지 확인
 */
export function needsCompression(file: File, options: ImageResizeOptions = {}): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return file.size > opts.maxFileSize;
}
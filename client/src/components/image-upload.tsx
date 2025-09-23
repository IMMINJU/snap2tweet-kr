import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { compressImage, formatFileSize, needsCompression } from "@/lib/image-utils";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const { toast } = useToast();
  const [isCompressing, setIsCompressing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files (ignore file-too-large since we'll auto-compress)
    const realErrors = rejectedFiles.filter(rejected => 
      !rejected.errors?.some((e: any) => e.code === 'file-too-large')
    );
    
    if (realErrors.length > 0) {
      const errors = realErrors.map(rejected => {
        if (rejected.errors?.some((e: any) => e.code === 'file-invalid-type')) {
          return `${rejected.file.name}: 지원하지 않는 파일 형식입니다`;
        }
        return `${rejected.file.name}: 업로드 실패`;
      });
      
      toast({
        title: "파일 업로드 오류",
        description: errors.join(', '),
        variant: "destructive",
      });
    }

    // Include oversized files for compression
    const oversizedFiles = rejectedFiles
      .filter(rejected => rejected.errors?.some((e: any) => e.code === 'file-too-large'))
      .map(rejected => rejected.file);
    
    const allFiles = [...acceptedFiles, ...oversizedFiles];

    if (images.length + allFiles.length > 4) {
      toast({
        title: "이미지 제한",
        description: "최대 4장까지만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (allFiles.length > 0) {
      setIsCompressing(true);
      
      try {
        const compressedImages: string[] = [];
        
        for (const file of allFiles) {
          const originalSize = formatFileSize(file.size);
          const needsCompress = needsCompression(file);
          

          
          const compressedBase64 = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.85, // WebP는 더 높은 품질 가능
            maxFileSize: 1.5 * 1024 * 1024, // WebP로 더 작게 압축 가능
          });
          
          const base64Data = compressedBase64.split(',')[1];
          const compressedSize = formatFileSize(base64Data.length * 0.75);
          

          
          compressedImages.push(base64Data);
        }
        
        // Final capacity check for iOS Safari
        const totalEstimated = [...images, ...compressedImages].reduce((sum, img) => sum + img.length * 0.75, 0);
        
        if (totalEstimated > 8 * 1024 * 1024) {
          toast({
            title: "저장소 용량 초과",
            description: "압축해도 용량이 큽니다. 이미지 장수를 줄여주세요.",
            variant: "destructive",
          });
          return;
        }
        
        onImagesChange([...images, ...compressedImages]);
        
      } catch (error) {
        console.error('Image compression error:', error);
        toast({
          title: "이미지 처리 오류",
          description: "이미지를 압축하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsCompressing(false);
      }
    }
  }, [images, onImagesChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    maxFiles: 4 - images.length,
    maxSize: 50 * 1024 * 1024, // 50MB (will auto-compress)
    multiple: true,
    disabled: isCompressing,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : isCompressing
            ? 'border-orange-400 bg-orange-50 pointer-events-none'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {isCompressing ? (
          <Loader2 className="w-8 h-8 text-orange-500 mx-auto mb-3 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        )}
        {isCompressing ? (
          <>
            <p className="text-orange-600 text-sm mb-1">이미지 압축 중...</p>
            <p className="text-xs text-orange-500">잠시만 기다려주세요</p>
          </>
        ) : isDragActive ? (
          <>
            <p className="text-blue-600 text-sm mb-1">여기에 이미지를 놓아주세요</p>
            <p className="text-xs text-blue-500">최대 4장까지</p>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-1">이미지를 드래그하거나 클릭</p>
            <p className="text-xs text-gray-500">JPG, PNG, WebP (WebP 자동 변환)</p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={`data:image/jpeg;base64,${image}`}
                alt={`Upload ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

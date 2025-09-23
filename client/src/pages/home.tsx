import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Camera, Star, Twitter, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { MenuInput } from "@/components/menu-input";
import { SatisfactionSelector } from "@/components/satisfaction-selector";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateTweet } from "@/lib/api";
import { type GenerateTweetRequest, satisfactionLevels } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [images, setImages] = useState<string[]>([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [menus, setMenus] = useState<string[]>([]);
  const [satisfaction, setSatisfaction] = useState<typeof satisfactionLevels[number]>("맛있음");

  const generateMutation = useMutation({
    mutationFn: generateTweet,
    onSuccess: (data) => {
      // Check if variations array is empty
      if (!data.variations || data.variations.length === 0) {
        toast({
          title: "트윗 생성 실패",
          description: "AI가 트윗을 생성하지 못했습니다. 다른 이미지나 메뉴로 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      // Store data in sessionStorage and navigate to results with iOS error handling
      try {
        const requestData = {
          images,
          restaurantName: restaurantName || undefined,
          menus,
          satisfaction,
        };
        
        sessionStorage.setItem('generatedTweets', JSON.stringify(data.variations));
        sessionStorage.setItem('tweetRequest', JSON.stringify(requestData));
        setLocation('/results');
      } catch (e) {
        console.error('sessionStorage quota exceeded:', e);
        toast({
          title: "저장소 오류",
          description: "결과를 임시 저장할 수 없습니다. 이미지 크기를 줄여주세요.",
          variant: "destructive",
        });
        
        // 임시 메모리 저장으로 폴백
        (window as any).__tempTweetData = {
          variations: data.variations,
          request: {
            images,
            restaurantName: restaurantName || undefined,
            menus,
            satisfaction,
          }
        };
        setLocation('/results');
      }
    },
    onError: (error: any) => {
      console.error('트윗 생성 에러:', error);
      
      let title = "트윗 생성 실패";
      let description = "다시 시도해주세요.";
      
      if (error.message?.includes('API key')) {
        title = "API 키 오류";
        description = "OpenAI API 키를 확인해주세요.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        title = "네트워크 오류";
        description = "인터넷 연결을 확인하고 다시 시도해주세요.";
      } else if (error.message?.includes('rate limit')) {
        title = "요청 한도 초과";
        description = "잠시 후 다시 시도해주세요.";
      } else if (error.message?.includes('image') || error.message?.includes('file')) {
        title = "이미지 처리 오류";
        description = "이미지 파일을 확인하고 다시 업로드해주세요.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (images.length === 0) {
      toast({
        title: "이미지가 필요합니다",
        description: "음식 사진을 하나 이상 업로드해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (menus.length === 0) {
      toast({
        title: "메뉴가 필요합니다",
        description: "메뉴를 하나 이상 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const request: GenerateTweetRequest = {
      images,
      restaurantName: restaurantName || undefined,
      menus,
      satisfaction,
    };

    // iOS Safari용 저장소 제한 체크
    try {
      const testData = JSON.stringify(request);
      sessionStorage.setItem('temp_test', testData);
      sessionStorage.removeItem('temp_test');
    } catch (e) {
      toast({
        title: "저장소 용량 초과",
        description: "이미지 크기를 줄이거나 장수를 줄여주세요. (iOS 저장소 제한)",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(request);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Twitter className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900">TweetGenAI</h1>
            </div>
            <p className="text-sm text-gray-500">음식 사진을 트위터 감성 트윗으로</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Image Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Camera className="w-4 h-4 mr-2" />
              사진 업로드 (최대 4장)
            </Label>
            <ImageUpload images={images} onImagesChange={setImages} />
          </div>

          {/* Restaurant Name */}
          <div>
            <Label htmlFor="restaurant-name" className="text-sm font-medium text-gray-900 mb-2 block">
              가게 이름 (선택)
            </Label>
            <Input
              id="restaurant-name"
              type="text"
              placeholder="홍대 김치찌개"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Menu */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              메뉴 <span className="text-gray-500 font-normal">(엔터 또는 쉼표로 추가)</span>
            </Label>
            <MenuInput menus={menus} onMenusChange={setMenus} />
          </div>

          {/* Satisfaction */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2" />
              만족도
            </Label>
            <SatisfactionSelector satisfaction={satisfaction} onSatisfactionChange={setSatisfaction} />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-medium"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                트윗 생성하기
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={generateMutation.isPending} 
        message="AI가 트윗을 생성하고 있습니다"
        submessage="음식 사진을 분석하고 멋진 트윗을 작성 중이에요"
      />
    </div>
  );
}

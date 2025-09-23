import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, RotateCcw, Twitter, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TweetResult } from "@/components/tweet-result";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useMutation } from "@tanstack/react-query";
import { generateTweet, shareTweets } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { type GenerateTweetRequest, type TweetVariation } from "@shared/schema";

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tweets, setTweets] = useState<TweetVariation[]>([]);
  const [requestData, setRequestData] = useState<GenerateTweetRequest | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    let tweets, request;
    
    // Try sessionStorage first
    try {
      const storedTweets = sessionStorage.getItem('generatedTweets');
      const storedRequest = sessionStorage.getItem('tweetRequest');
      
      if (storedTweets) {
        tweets = JSON.parse(storedTweets);
      }
      if (storedRequest) {
        request = JSON.parse(storedRequest);
      }
    } catch (e) {
      console.log('sessionStorage failed, checking temp data');
    }
    
    // Fallback to temp memory storage for iOS
    if (!tweets || !request) {
      const tempData = (window as any).__tempTweetData;
      if (tempData) {
        tweets = tempData.variations;
        request = tempData.request;
        // Clean up temp data
        delete (window as any).__tempTweetData;
      }
    }
    
    if (tweets) {
      setTweets(tweets);
    }
    if (request) {
      setRequestData(request);
      setImages(request.images || []);
    }

    if (!tweets || !request) {
      setLocation('/');
    }
  }, [setLocation]);

  const regenerateMutation = useMutation({
    mutationFn: generateTweet,
    onSuccess: (data) => {
      if (!data.variations || data.variations.length === 0) {
        toast({
          title: "재생성 실패",
          description: "AI가 트윗을 생성하지 못했습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      setTweets(data.variations);
      try {
        sessionStorage.setItem('generatedTweets', JSON.stringify(data.variations));
      } catch (e) {
        console.log('sessionStorage quota exceeded during regeneration');
        // Continue without storing, data is in memory
      }
      toast({
        title: "트윗 재생성 완료!",
        description: "새로운 트윗이 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error('트윗 재생성 에러:', error);
      
      let title = "재생성 실패";
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

  const shareMutation = useMutation({
    mutationFn: shareTweets,
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.shareId}`;
      setShareUrl(url);
      setIsShared(true);
      
      // Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "공유 링크 생성 완료!",
          description: "링크가 클립보드에 복사되었습니다.",
        });
      }).catch(() => {
        toast({
          title: "공유 링크 생성 완료!",
          description: "링크를 복사해서 공유해보세요.",
        });
      });
    },
    onError: (error) => {
      toast({
        title: "공유 링크 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegenerate = () => {
    if (requestData) {
      regenerateMutation.mutate(requestData);
    }
  };

  const handleShare = () => {
    if (requestData && tweets.length > 0) {
      shareMutation.mutate({
        images: requestData.images,
        restaurantName: requestData.restaurantName,
        menus: requestData.menus,
        satisfaction: requestData.satisfaction,
        variations: tweets,
      });
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "링크 복사됨!",
          description: "공유 링크가 클립보드에 복사되었습니다.",
        });
      });
    }
  };

  const goBack = () => {
    setLocation('/');
  };

  if (!requestData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">데이터를 불러올 수 없습니다.</p>
          <Button onClick={goBack}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  if (!tweets.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">생성된 트윗이 없습니다.</p>
          <Button onClick={goBack}>다시 생성하기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              뒤로가기
            </Button>
            
            <div className="flex items-center gap-2">
              <Twitter className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900">생성된 트윗</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleShare}
                disabled={shareMutation.isPending}
                className="flex items-center gap-2"
              >
                {isShared ? (
                  <>
                    <Check className="w-4 h-4" />
                    공유됨
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    공유
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regenerateMutation.isPending}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                재생성
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {tweets.map((tweet, index) => (
            <TweetResult key={index} tweet={tweet} images={images} />
          ))}
        </div>

        {isShared && shareUrl && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-2">공유 링크가 생성되었습니다:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded"
              />
              <Button
                size="sm"
                onClick={copyShareUrl}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                복사
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            onClick={goBack}
            variant="outline"
            className="w-full"
          >
            새 트윗 생성하기
          </Button>
        </div>
      </main>

      {/* Loading Overlays */}
      <LoadingOverlay 
        isVisible={shareMutation.isPending} 
        message="공유 링크를 생성하고 있습니다"
        submessage="소셜미디어에서 예쁘게 보이도록 준비 중이에요"
      />
      <LoadingOverlay 
        isVisible={regenerateMutation.isPending} 
        message="새로운 트윗을 생성하고 있습니다"
        submessage="더 멋진 표현으로 다시 써보고 있어요"
      />
    </div>
  );
}
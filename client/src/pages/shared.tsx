import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TweetResult } from "@/components/tweet-result";
import { useQuery } from "@tanstack/react-query";
import { getSharedTweets } from "@/lib/api";
import { type SharedTweet } from "@shared/schema";

export default function Shared() {
  const [match, params] = useRoute("/shared/:id");
  const shareId = params?.id;

  const { data: sharedTweet, isLoading, error } = useQuery({
    queryKey: ['/api/share', shareId],
    queryFn: () => getSharedTweets(shareId!),
    enabled: !!shareId,
  });

  const goHome = () => {
    window.location.href = '/';
  };

  if (!match || !shareId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">잘못된 공유 링크입니다.</p>
          <Button onClick={goHome}>홈으로 가기</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">공유된 트윗을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedTweet) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">공유된 트윗을 찾을 수 없습니다.</p>
          <Button onClick={goHome}>홈으로 가기</Button>
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
              onClick={goHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Button>
            
            <div className="flex items-center gap-2">
              <Twitter className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900">공유된 트윗</span>
            </div>

            <div className="text-xs text-gray-500">
              {new Date(sharedTweet.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Restaurant info */}
        {(sharedTweet.restaurantName || sharedTweet.menus.length > 0) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {sharedTweet.restaurantName && (
              <p className="font-medium text-gray-900 mb-2">{sharedTweet.restaurantName}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {sharedTweet.menus.map((menu, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                  {menu}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">만족도: {sharedTweet.satisfaction}</p>
          </div>
        )}

        <div className="space-y-4">
          {sharedTweet.variations.map((tweet, index) => (
            <TweetResult key={index} tweet={tweet} images={sharedTweet.images} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={goHome} className="bg-blue-500 hover:bg-blue-600 text-white">
            나도 트윗 생성하기
          </Button>
        </div>
      </main>
    </div>
  );
}
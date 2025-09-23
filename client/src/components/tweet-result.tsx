import { useState, useMemo } from "react";
import { Copy, MessageCircle, Repeat2, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type TweetVariation } from "@shared/schema";

interface TweetResultProps {
  tweet: TweetVariation;
  images?: string[];
}

const toneColors = {
  "솔직톤": "bg-blue-50 text-blue-600",
  "드립톤": "bg-purple-50 text-purple-600", 
  "극단톤": "bg-red-50 text-red-600",
};

const mockProfiles = [
  {
    name: "김트위터",
    username: "user123",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
  },
  {
    name: "이트윗",
    username: "tweet_lover",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
  },
  {
    name: "박소셜",
    username: "social_park",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"
  }
];

const getMockStats = (tone: string) => {
  const baseStats = {
    "솔직톤": { comments: 12, retweets: 3, likes: 48 },
    "드립톤": { comments: 8, retweets: 15, likes: 92 },
    "극단톤": { comments: 24, retweets: 8, likes: 156 },
  };
  return baseStats[tone as keyof typeof baseStats] || { comments: 5, retweets: 2, likes: 25 };
};

export function TweetResult({ tweet, images }: TweetResultProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // 트윗 톤에 따라 고정된 프로필 사용 (랜덤하지 않게)
  const profile = useMemo(() => {
    const profileIndex = tweet.tone === "솔직톤" ? 0 : tweet.tone === "드립톤" ? 1 : 2;
    return mockProfiles[profileIndex];
  }, [tweet.tone]);
  
  const stats = getMockStats(tweet.tone);

  const copyTweet = async () => {
    try {
      await navigator.clipboard.writeText(tweet.content);
      setCopied(true);
      toast({
        title: "복사 완료!",
        description: "트윗이 클립보드에 복사되었습니다.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-3">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900 text-sm">{profile.name}</span>
            <span className="text-gray-500 text-sm">@{profile.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm">5분</span>
            <Badge className={`text-xs ${toneColors[tweet.tone]} ml-auto`} variant="secondary">
              {tweet.tone}
            </Badge>
          </div>
          
          <div className="text-gray-900 mb-3 leading-relaxed whitespace-pre-wrap">
            {tweet.content}
          </div>
          
          {images && images.length > 0 && (
            <div className={`mb-3 rounded-2xl overflow-hidden border ${
              images.length === 1 ? 'max-w-sm' : ''
            }`}>
              {images.length === 1 ? (
                <img
                  src={`data:image/jpeg;base64,${images[0]}`}
                  alt="Food image"
                  className="w-full h-80 object-cover"
                />
              ) : images.length === 2 ? (
                <div className="grid grid-cols-2 gap-0.5">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={`data:image/jpeg;base64,${image}`}
                      alt={`Food image ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  ))}
                </div>
              ) : images.length === 3 ? (
                <div className="grid grid-cols-2 gap-0.5">
                  <img
                    src={`data:image/jpeg;base64,${images[0]}`}
                    alt="Food image 1"
                    className="w-full h-96 object-cover row-span-2"
                  />
                  <div className="grid gap-0.5">
                    <img
                      src={`data:image/jpeg;base64,${images[1]}`}
                      alt="Food image 2"
                      className="w-full h-47 object-cover"
                    />
                    <img
                      src={`data:image/jpeg;base64,${images[2]}`}
                      alt="Food image 3"
                      className="w-full h-47 object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-0.5">
                  {images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={`data:image/jpeg;base64,${image}`}
                      alt={`Food image ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{stats.comments}</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                <Repeat2 className="w-4 h-4" />
                <span>{stats.retweets}</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                <Heart className="w-4 h-4" />
                <span>{stats.likes}</span>
              </button>
            </div>
            
            <Button
              onClick={copyTweet}
              size="sm"
              className={`${
                copied 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  복사
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sharedTweets } from '@shared/schema';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet) {
      return {
        title: '공유 링크를 찾을 수 없습니다 - Snap2Tweet KR',
        description: '요청하신 공유 링크를 찾을 수 없습니다.',
      };
    }

    // Create preview content with better messaging
    const restaurantInfo = sharedTweet.restaurantName ? `${sharedTweet.restaurantName}` : '맛집';
    const menuList = sharedTweet.menus.slice(0, 2).join(', ');
    const moreMenus = sharedTweet.menus.length > 2 ? ` 외 ${sharedTweet.menus.length - 2}개` : '';

    const title = `🍽️ ${restaurantInfo}에서 ${menuList}${moreMenus} 먹고 AI가 써준 트윗`;
    const description = `"${sharedTweet.variations[0]?.content.substring(0, 80)}..." - ${sharedTweet.satisfaction} 만족도로 ${sharedTweet.variations.length}가지 톤의 트윗을 생성했어요!`;

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Use actual image URL instead of base64
    const previewImageUrl = sharedTweet.images[0] ? `${baseUrl}/shared/${id}/image` : undefined;

    return {
      title,
      description,
      openGraph: {
        type: 'article',
        url: `${baseUrl}/shared/${id}`,
        title,
        description,
        images: previewImageUrl ? [{ url: previewImageUrl, width: 1200, height: 630 }] : [],
        siteName: 'Snap2Tweet KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: previewImageUrl ? [previewImageUrl] : [],
      },
      other: {
        author: 'Snap2Tweet KR',
        robots: 'index, follow',
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return {
      title: '오류 발생 - Snap2Tweet KR',
      description: '페이지를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

export default async function SharedPage({ params }: Props) {
  try {
    const { id } = await params;
    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet) {
      notFound();
    }

    // Redirect to main app with share parameter
    redirect(`/?share=${id}`);
  } catch (error) {
    console.error("Shared page error:", error);
    // Redirect to main app on error
    redirect('/');
  }
}
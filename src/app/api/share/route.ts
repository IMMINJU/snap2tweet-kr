import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  shareRequestSchema,
  sharedTweets
} from '@shared/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shareData = shareRequestSchema.parse(body);

    const [sharedTweet] = await db.insert(sharedTweets).values({
      images: shareData.images,
      restaurantName: shareData.restaurantName,
      menus: shareData.menus,
      satisfaction: shareData.satisfaction,
      variations: shareData.variations,
    }).returning();

    return NextResponse.json({ shareId: sharedTweet.id });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json(
      { message: "공유 링크 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
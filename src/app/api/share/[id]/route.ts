import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sharedTweets } from '@shared/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet) {
      return NextResponse.json(
        { message: "공유 링크를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(sharedTweet);
  } catch (error) {
    console.error("Get shared tweet error:", error);
    return NextResponse.json(
      { message: "공유 트윗을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
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
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet || !sharedTweet.images[0]) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Convert base64 to buffer and serve as image
    const imageBuffer = Buffer.from(sharedTweet.images[0], 'base64');

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("Image serve error:", error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}
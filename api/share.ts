import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../server/db.js';
import {
  shareRequestSchema,
  sharedTweets
} from '../shared/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const shareData = shareRequestSchema.parse(req.body);

    const [sharedTweet] = await db.insert(sharedTweets).values({
      images: shareData.images,
      restaurantName: shareData.restaurantName,
      menus: shareData.menus,
      satisfaction: shareData.satisfaction,
      variations: shareData.variations,
    }).returning();

    res.json({ shareId: sharedTweet.id });
  } catch (error) {
    console.error("Share error:", error);
    res.status(500).json({ message: "공유 링크 생성 중 오류가 발생했습니다." });
  }
}
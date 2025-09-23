import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../server/db.js';
import { sharedTweets } from '../../shared/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: "유효하지 않은 ID입니다." });
    }

    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet) {
      return res.status(404).json({ message: "공유 링크를 찾을 수 없습니다." });
    }

    res.json(sharedTweet);
  } catch (error) {
    console.error("Get shared tweet error:", error);
    res.status(500).json({ message: "공유 트윗을 가져오는 중 오류가 발생했습니다." });
  }
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db.js';
import { sharedTweets } from '../../../shared/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).send('Invalid ID');
    }

    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet || !sharedTweet.images[0]) {
      return res.status(404).send('Image not found');
    }

    // Convert base64 to buffer and serve as image
    const imageBuffer = Buffer.from(sharedTweet.images[0], 'base64');

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    res.send(imageBuffer);
  } catch (error) {
    console.error("Image serve error:", error);
    res.status(500).send('Error serving image');
  }
}
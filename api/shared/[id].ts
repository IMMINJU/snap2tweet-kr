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
      return res.status(400).send('Invalid ID');
    }

    const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));

    if (!sharedTweet) {
      // Serve 404 page with basic meta tags
      const notFoundTemplate = `
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>공유 링크를 찾을 수 없습니다 - TweetGenAI</title>
            <meta name="description" content="요청하신 공유 링크를 찾을 수 없습니다.">
            <meta property="og:title" content="공유 링크를 찾을 수 없습니다 - TweetGenAI">
            <meta property="og:description" content="요청하신 공유 링크를 찾을 수 없습니다.">
            <meta property="og:type" content="website">
            <meta name="twitter:card" content="summary">
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.send(notFoundTemplate);
    }

    // Create preview content with better messaging
    const restaurantInfo = sharedTweet.restaurantName ? `${sharedTweet.restaurantName}` : '맛집';
    const menuList = sharedTweet.menus.slice(0, 2).join(', ');
    const moreMenus = sharedTweet.menus.length > 2 ? ` 외 ${sharedTweet.menus.length - 2}개` : '';

    const title = `🍽️ ${restaurantInfo}에서 ${menuList}${moreMenus} 먹고 AI가 써준 트윗`;
    const description = `"${sharedTweet.variations[0]?.content.substring(0, 80)}..." - ${sharedTweet.satisfaction} 만족도로 ${sharedTweet.variations.length}가지 톤의 트윗을 생성했어요!`;

    // Get base URL from request headers
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https'; // Vercel uses HTTPS
    const baseUrl = `${protocol}://${host}`;

    // Use actual image URL instead of base64
    const previewImageUrl = sharedTweet.images[0] ? `${baseUrl}/shared/${id}/image` : '';

    const template = `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <meta name="description" content="${description}">

          <!-- Open Graph / Facebook -->
          <meta property="og:type" content="article">
          <meta property="og:url" content="${baseUrl}/shared/${id}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          ${previewImageUrl ? `<meta property="og:image" content="${previewImageUrl}">` : ''}
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">
          <meta property="og:site_name" content="TweetGenAI">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${baseUrl}/shared/${id}">
          <meta property="twitter:title" content="${title}">
          <meta property="twitter:description" content="${description}">
          ${previewImageUrl ? `<meta property="twitter:image" content="${previewImageUrl}">` : ''}

          <!-- Additional meta tags -->
          <meta name="robots" content="index, follow">
          <meta name="author" content="TweetGenAI">

          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "${title}",
            "description": "${description}",
            "author": {
              "@type": "Organization",
              "name": "TweetGenAI"
            },
            "datePublished": "${sharedTweet.createdAt}",
            "url": "${baseUrl}/shared/${id}",
            "image": "${previewImageUrl}"
          }
          </script>

          <script>
            // Redirect to React app after meta tags are loaded by crawlers
            setTimeout(function() {
              window.location.href = '/?share=${id}';
            }, 100);
          </script>
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: system-ui;">
            <h2>🍽️ ${restaurantInfo}</h2>
            <p>${menuList}${moreMenus}</p>
            <p>AI가 생성한 트윗을 확인하고 있습니다...</p>
            <a href="/?share=${id}" style="color: #3b82f6; text-decoration: underline;">
              여기를 클릭하면 바로 확인할 수 있습니다
            </a>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(template);
  } catch (error) {
    console.error("Shared page error:", error);
    const errorTemplate = `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>오류 발생 - TweetGenAI</title>
          <meta name="description" content="페이지를 불러오는 중 오류가 발생했습니다.">
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(errorTemplate);
  }
}
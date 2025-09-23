import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  generateTweetRequestSchema, 
  shareRequestSchema,
  sharedTweets,
  type GenerateTweetResponse,
  type ShareRequest,
  type TweetVariation
} from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve image endpoint for social media previews
  app.get("/shared/:id/image", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));
      
      if (!sharedTweet || !sharedTweet.images[0]) {
        return res.status(404).send('Image not found');
      }

      // Convert base64 to buffer and serve as image
      const imageBuffer = Buffer.from(sharedTweet.images[0], 'base64');
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error("Image serve error:", error);
      res.status(500).send('Error serving image');
    }
  });

  // Serve shared tweet page with meta tags for social media previews (must come before other routes)
  app.get("/shared/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));
      
      if (!sharedTweet) {
        // Serve 404 page with basic meta tags
        return res.send(`
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
        `);
      }

      // Create preview content with better messaging
      const restaurantInfo = sharedTweet.restaurantName ? `${sharedTweet.restaurantName}` : '맛집';
      const menuList = sharedTweet.menus.slice(0, 2).join(', ');
      const moreMenus = sharedTweet.menus.length > 2 ? ` 외 ${sharedTweet.menus.length - 2}개` : '';
      
      const title = `🍽️ ${restaurantInfo}에서 ${menuList}${moreMenus} 먹고 AI가 써준 트윗`;
      const description = `"${sharedTweet.variations[0]?.content.substring(0, 80)}..." - ${sharedTweet.satisfaction} 만족도로 ${sharedTweet.variations.length}가지 톤의 트윗을 생성했어요!`;
      
      // Use actual image URL instead of base64
      const previewImageUrl = sharedTweet.images[0] ? `${req.protocol}://${req.get('host')}/shared/${id}/image` : '';

      // For both dev and prod, serve static HTML with meta tags and redirect
      const baseUrl = req.protocol + '://' + req.get('host');
      const isProduction = process.env.NODE_ENV === 'production';
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
      res.status(500).send(`
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
      `);
    }
  });
  
  app.post("/api/generate-tweet", upload.array('images', 4), async (req, res) => {
    try {
      const { restaurantName, menus, satisfaction } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "이미지를 하나 이상 업로드해주세요." });
      }

      // Convert images to base64
      const images = files.map(file => file.buffer.toString('base64'));
      
      // Parse menus from string if needed
      const parsedMenus = typeof menus === 'string' ? JSON.parse(menus) : menus;

      // Validate request data
      const validatedData = generateTweetRequestSchema.parse({
        images,
        restaurantName: restaurantName || undefined,
        menus: parsedMenus,
        satisfaction,
      });

      // Generate tweets using OpenAI
      const systemPrompt = `당신은 트위터 헤비유저처럼 말해야 하고, 광고처럼 보이면 안 됩니다.
문장은 1~2줄, 가볍고 툭 던지는 말투로 작성해주세요.
메뉴, 사진, 만족도 정보를 반영해서 TL에 올릴 법한 트윗을 만들어주세요.

다음 3가지 톤으로 트윗을 작성해주세요:
1. 솔직톤: 직설적이고 가벼운 톤
2. 드립톤: 트위터 밈과 자조적 개그가 섞인 톤  
3. 극단톤: 극찬 또는 혹평, TL에서 던지는 킹받는 멘트

JSON 형식으로 응답해주세요:
{
  "variations": [
    {"content": "트윗 내용", "tone": "솔직톤"},
    {"content": "트윗 내용", "tone": "드립톤"},
    {"content": "트윗 내용", "tone": "극단톤"}
  ]
}`;

      const userPrompt = `가게: ${validatedData.restaurantName || "알 수 없음"}
메뉴: ${validatedData.menus.join(", ")}
만족도: ${validatedData.satisfaction}
사진: 첨부된 음식 사진들을 분석해서 트윗에 반영해주세요.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...validatedData.images.map(image => ({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` }
            }))
          ]
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      const tweetResponse: GenerateTweetResponse = {
        variations: result.variations || []
      };

      res.json(tweetResponse);
    } catch (error) {
      console.error("Tweet generation error:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: `트윗 생성 중 오류가 발생했습니다: ${error.message}` });
      } else {
        res.status(500).json({ message: "트윗 생성 중 오류가 발생했습니다." });
      }
    }
  });

  // Share tweets endpoint
  app.post("/api/share", async (req, res) => {
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
  });

  // Get shared tweets endpoint
  app.get("/api/share/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [sharedTweet] = await db.select().from(sharedTweets).where(eq(sharedTweets.id, id));
      
      if (!sharedTweet) {
        return res.status(404).json({ message: "공유 링크를 찾을 수 없습니다." });
      }

      res.json(sharedTweet);
    } catch (error) {
      console.error("Get shared tweet error:", error);
      res.status(500).json({ message: "공유 트윗을 가져오는 중 오류가 발생했습니다." });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}

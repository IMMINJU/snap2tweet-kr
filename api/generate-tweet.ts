import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import OpenAI from 'openai';
import { db } from '../server/db.js';
import {
  generateTweetRequestSchema,
  type GenerateTweetResponse
} from '../shared/schema.js';

// Configure multer for Vercel
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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here",
});

// Helper function to handle multer in Vercel
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.array('images', 4));

    const { restaurantName, menus, satisfaction } = req.body;
    const files = (req as any).files as Express.Multer.File[] | undefined;

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
}
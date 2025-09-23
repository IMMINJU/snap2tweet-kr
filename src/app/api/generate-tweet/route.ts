import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  generateTweetRequestSchema,
  type GenerateTweetResponse
} from '@shared/schema';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const restaurantName = formData.get('restaurantName') as string | null;
    const menus = formData.get('menus') as string;
    const satisfaction = formData.get('satisfaction') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json(
        { message: "이미지를 하나 이상 업로드해주세요." },
        { status: 400 }
      );
    }

    // Convert images to base64
    const images = await Promise.all(
      imageFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      })
    );

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

    return NextResponse.json(tweetResponse);
  } catch (error) {
    console.error("Tweet generation error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { message: `트윗 생성 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { message: "트윗 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  }
}
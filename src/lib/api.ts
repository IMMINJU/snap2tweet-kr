import { type GenerateTweetRequest, type GenerateTweetResponse, type ShareRequest, type SharedTweet } from "@shared/schema";

export async function generateTweet(data: GenerateTweetRequest): Promise<GenerateTweetResponse> {
  const formData = new FormData();
  
  // Convert base64 images back to files for upload
  data.images.forEach((base64Image, index) => {
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    formData.append('images', blob, `image-${index}.jpg`);
  });

  if (data.restaurantName) {
    formData.append('restaurantName', data.restaurantName);
  }
  formData.append('menus', JSON.stringify(data.menus));
  formData.append('satisfaction', data.satisfaction);

  const response = await fetch('/api/generate-tweet', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '트윗 생성에 실패했습니다.');
  }

  return response.json();
}

export async function shareTweets(request: ShareRequest): Promise<{ shareId: string }> {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '공유 링크 생성에 실패했습니다.');
  }

  return response.json();
}

export async function getSharedTweets(shareId: string): Promise<SharedTweet> {
  const response = await fetch(`/api/share/${shareId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '공유된 트윗을 불러오는데 실패했습니다.');
  }

  return response.json();
}

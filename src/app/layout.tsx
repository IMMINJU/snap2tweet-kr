import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata = {
  title: "Snap2Tweet KR",
  description: "음식 사진으로 한국어 트윗 생성",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
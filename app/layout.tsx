import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rohit Sharma — The Hitman | A Cinematic Tribute",
  description:
    "An immersive WebGL particle experience celebrating Rohit Sharma, India's legendary cricket captain. Scroll through a living particle universe as cricket objects form and transform, showcasing his greatest achievements.",
  keywords: [
    "Rohit Sharma",
    "cricket",
    "tribute",
    "WebGL",
    "particle experience",
    "The Hitman",
    "India cricket",
    "264",
  ],
  openGraph: {
    title: "Rohit Sharma — The Hitman | A Cinematic Tribute",
    description:
      "An immersive WebGL particle experience celebrating India's greatest ODI batsman.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "800", "900"], variable: "--font-cinzel" });
const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"], 
  style: ["normal", "italic"],
  variable: "--font-cormorant" 
});

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
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}

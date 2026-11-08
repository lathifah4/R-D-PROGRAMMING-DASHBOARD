import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./dashboard.css";

const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iNews Performance",
  description:
    "Dashboard performa channel, program, konten, dan ekosistem media iNews.",
  icons: { icon: "/INews.png", apple: "/INews.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${barlow.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} scroll-smooth motion-reduce:scroll-auto`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: 'try{document.documentElement.classList.toggle("dark",localStorage.getItem("inews-theme")==="dark")}catch{}' }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import { Geist_Mono, Inter } from "next/font/google"
import { Toaster } from "sonner";

import "./globals.css"
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: 'ThumbAi - AI powered youtube thumbnail generator',
  description:'Generate high converting thumbnail with ai'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
       
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}

           <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

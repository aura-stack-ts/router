import "@/app/global.css"
import { RootProvider } from "fumadocs-ui/provider/next"
import { Sora } from "next/font/google"

const sora = Sora({
    subsets: ["latin"],
    display: "swap",
})

export { metadata } from "@/lib/metadata"

export default function Layout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={`${sora.className} antialiased`} suppressHydrationWarning>
            <body className="flex flex-col min-h-screen bg-black">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    )
}

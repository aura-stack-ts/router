import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"

const links = [
    {
        title: "Product",
        items: [
            { title: "Features", href: "#features" },
            { title: "Documentation", href: "/docs" },
            { title: "Quick Start", href: "/docs" },
        ],
    },
    {
        title: "Community",
        items: [
            { title: "GitHub", href: "https://github.com/aura-stack-ts/router" },
            { title: "Discussions", href: "https://github.com/aura-stack-ts/router/discussions" },
            { title: "Issues", href: "https://github.com/aura-stack-ts/router/issues" },
        ],
    },
]

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t border-white/10 bg-black pt-16 pb-8 md:pt-24 md:pb-12">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" aria-label="home" className="text-xl font-bold tracking-tighter text-white">
                            @aura-stack/router
                        </Link>
                        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                            Build type-safe APIs with confidence. The next-generation router for modern TypeScript backends.
                        </p>
                    </div>
                    {links.map((group, index) => (
                        <div key={index}>
                            <h3 className="text-sm font-semibold text-white tracking-wide">{group.title}</h3>
                            <ul className="mt-4 space-y-3">
                                {group.items.map((item, idx) => (
                                    <li key={idx}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-muted-foreground hover:text-white transition-colors duration-200"
                                        >
                                            {item.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-16 border-t border-white/10 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-sm text-muted-foreground">&copy; {currentYear} Aura Stack. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link
                            href="https://github.com/aura-stack-ts/router"
                            target="_blank"
                            className="text-muted-foreground hover:text-white transition-colors"
                        >
                            <span className="sr-only">GitHub</span>
                            <Github className="size-5" />
                        </Link>
                        <Link
                            href="https://x.com/sshahaider"
                            target="_blank"
                            className="text-muted-foreground hover:text-white transition-colors"
                        >
                            <span className="sr-only">Twitter</span>
                            <Twitter className="size-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

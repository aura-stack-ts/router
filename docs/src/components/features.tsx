import { Cpu, Lock, Sparkles, Zap } from "lucide-react"
import Image from "next/image"

export const Features = () => {
 return (
        <section id="features" className="py-24 md:py-32 relative">
            <div className="mx-auto max-w-6xl space-y-16 px-6">
                <div className="relative z-10 grid items-center gap-8 md:grid-cols-2 md:gap-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Built for DX Backends</h2>
                    <p className="max-w-lg text-lg text-muted-foreground sm:ml-auto">
                        Designed for Developer Experience. A simple, intuitive, and type-safe API for building robust backends without the boilerplate.
                    </p>
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-[88/36] relative">
                        <Image className="mx-auto" src="/create-api-v3.svg" alt="Endpoint Illustration" width={1200} height={620} />
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4" />
                            <h3 className="text-sm font-medium">Any JS Runtime</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Deploy to Node.js, Deno, Bun, or Cloudflare Workers. Write once, run everywhere without platform
                            lock-in.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="size-4" />
                            <h3 className="text-sm font-medium">E2E Type Safety</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Share types directly between your backend and frontend. Get compile-time errors before you deploy.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Lock className="size-4" />
                            <h3 className="text-sm font-medium">Zod Integration</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            First-class support for Zod. Validate your API inputs and outputs effortlessly using powerful schemas.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4" />
                            <h3 className="text-sm font-medium">Auto-gen Client</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Stop writing fetch wrappers. Automatically generate a fully typed, light-weight API client for your
                            frontend.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
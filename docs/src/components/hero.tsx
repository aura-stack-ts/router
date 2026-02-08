"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedGroup } from "@/components/ui/animated-group"
import Image from "next/image"

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: "blur(12px)",
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export const Hero = () => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText("npm i @aura-stack/router")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <main className="overflow-hidden bg-black">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
                >
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <AnimatedGroup
                            variants={
                                {
                                    container: {
                                        visible: {
                                            transition: {
                                                delayChildren: 1,
                                            },
                                        },
                                    },
                                    item: {
                                        hidden: {
                                            opacity: 0,
                                            y: 20,
                                        },
                                        visible: {
                                            opacity: 1,
                                            y: 0,
                                            transition: {
                                                type: "spring",
                                                bounce: 0.3,
                                                duration: 2,
                                            },
                                        },
                                    },
                                } as any
                            }
                            className="absolute inset-0 -z-20"
                        ></AnimatedGroup>
                        <div
                            aria-hidden
                            className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
                        />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants as any}>
                                    <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl font-bold tracking-tight md:text-7xl lg:mt-16">
                                        TypeScript-first routing with typed endpoints.
                                    </h1>
                                    <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                                        Build your next project with confidence using a router designed for predictable types,
                                        structured endpoints, and clean client generation.
                                    </p>
                                </AnimatedGroup>
                                <AnimatedGroup
                                    variants={
                                        {
                                            container: {
                                                visible: {
                                                    transition: {
                                                        staggerChildren: 0.05,
                                                        delayChildren: 0.75,
                                                    },
                                                },
                                            },
                                            ...transitionVariants,
                                        } as any
                                    }
                                    className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row"
                                >
                                    <div key={1} className="bg-foreground/10 rounded-[14px] border p-0.5">
                                        <Button asChild size="lg">
                                            <Link href="/docs">
                                                <span className="text-nowrap font-semibold">Get Started</span>
                                                <ArrowRight className="size-4 ml-2" />
                                            </Link>
                                        </Button>
                                    </div>

                                    <Button
                                        className="flex items-center gap-3"
                                        key={2}
                                        size="lg"
                                        variant="outline"
                                        onClick={handleCopy}
                                    >
                                        <span className="font-mono text-sm text-muted-foreground">npm i @aura-stack/router</span>
                                        {copied ? (
                                            <Check className="size-4 text-green-400" />
                                        ) : (
                                            <Copy className="size-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                    <figure className="rounded-3xl relative mt-16 p-2 md:mt-24">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                        <Image
                            className="mx-auto"
                            src="/router-core-v9.svg"
                            alt="Router architecture diagram"
                            width={1000}
                            height={600}
                            priority
                        />
                    </figure>
                </section>
            </main>
        </>
    )
}

Hero.displayName = "Hero"

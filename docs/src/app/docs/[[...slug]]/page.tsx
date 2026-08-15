import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { source } from "@/lib/source"
import { DocsBody, DocsPage, DocsTitle, DocsDescription } from "fumadocs-ui/page"
import { getMDXComponents } from "@/mdx-components"
import { createRelativeLink } from "fumadocs-ui/mdx"

export default async function Page(props: Readonly<PageProps<"/docs/[[...slug]]">>) {
    const params = await props.params
    const page = source.getPage(params.slug)
    if (!page) notFound()

    const Mdx = page.data.body

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription className="pb-6 border-b">{page.data.description}</DocsDescription>
            <DocsBody>
                <Mdx
                    components={getMDXComponents({
                        a: createRelativeLink(source, page),
                    })}
                />
            </DocsBody>
        </DocsPage>
    )
}

export async function generateStaticParams() {
    return source.generateParams()
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
    const params = await props.params
    const page = source.getPage(params.slug)
    if (!page) {
        notFound()
    }

    return {
        title: page.data.title,
        description: page.data.description,
    }
}

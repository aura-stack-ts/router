import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config"
import { transformerTwoslash } from "fumadocs-twoslash"
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins"
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs"

export const docs = defineDocs({
    dir: "src/content/docs",
    docs: {
        schema: frontmatterSchema,
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
    meta: {
        schema: metaSchema,
    },
})

export default defineConfig({
    mdxOptions: {
        rehypeCodeOptions: {
            themes: {
                light: "github-light",
                dark: "github-dark",
            },
            transformers: [
                // @ts-expect-error - upgraded dependencies to patch vulnerabilities and have introduced type mismatches
                ...(rehypeCodeDefaultOptions.transformers ?? []),
                // @ts-expect-error - upgraded dependencies to patch vulnerabilities and have introduced type mismatches
                transformerTwoslash({
                    typesCache: createFileSystemTypesCache(),
                }),
            ],
        },
    },
})

import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import * as Twoslash from "fumadocs-twoslash/ui"
import * as StepComponents from "fumadocs-ui/components/steps"
import * as TabsComponents from "fumadocs-ui/components/tabs"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultMdxComponents,
        ...Twoslash,
        ...StepComponents,
        ...TabsComponents,
        ...components,
    }
}

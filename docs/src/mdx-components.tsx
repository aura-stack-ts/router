import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import * as Twoslash from "fumadocs-twoslash/ui"
import * as StepComponents from "fumadocs-ui/components/steps"
import * as TabsComponents from "fumadocs-ui/components/tabs"
import * as CardComponents from "fumadocs-ui/components/card"
import * as StepsComponents from "fumadocs-ui/components/steps"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultMdxComponents,
        ...Twoslash,
        ...StepComponents,
        ...TabsComponents,
        ...CardComponents,
        ...StepsComponents,
        ...components,
    }
}

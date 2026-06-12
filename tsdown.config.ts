import { defineConfig } from "tsdown"

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/router.ts",
        "src/endpoint.ts",
        "src/error.ts",
        "src/headers.ts",
        "src/cookie.ts",
        "src/client.ts",
        "src/@types/index.ts",
        "src/validator/registry.ts",
    ],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: true,
    treeshake: true,
    fixedExtension: false,
    platform: "neutral",
    deps: {
        onlyBundle: false,
    },
})

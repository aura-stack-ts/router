import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        benchmark: {
            include: ["bench/**/*.bench.ts"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})

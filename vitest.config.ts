import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        benchmark: {
            include: ["bench/**/*.bench.ts"],
        },
        typecheck: {
            enabled: false,
            include: ["test/**/*.test-d.ts"],
            exclude: ["test/**/*.test.ts"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@test": path.resolve(__dirname, "./test"),
        },
    },
})

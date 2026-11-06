# Contributing to Aura Stack Router

Thank you for considering contributing to Aura Stack Router! It's people like you that make this project such a great tool for the community.

## Documentation

Visit the [**official contributing guide**](https://aura-stack-router.vercel.app/docs/contributing).

## Getting Started

**Clone your fork**:

```bash
git clone https://github.com/YOUR_USERNAME/router.git
cd router
```

**Install dependencies**:

```bash
pnpm install
```

**Build packages**:

```bash
# Build all packages
pnpm build

# Build main packages only
pnpm build --filter=./packages/*
```

## Development

**Running the documentation server**:

```bash
# Run all dev servers
pnpm dev

# Run docs only
pnpm dev:docs

# Alternative way to run docs
pnpm dev --filter=docs

```

Once started, open your browser at `http://localhost:3000` to view the app.

**Running test**:

```bash
# Run tests
pnpm test
```

**Formatting and style**

```bash
# Type checking
pnpm type-check

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Documentation

Visit the [**official documentation website**](https://aura-stack-router.vercel.app).

## License

Licensed under the [MIT License](LICENSE). © [Aura Stack](https://github.com/aura-stack-ts)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/aura-stack-ts">Aura Stack team</a>
</p>

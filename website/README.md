# OpenAPI Sync Website

This is the official website for [OpenAPI Sync](https://github.com/akintomiwa-fisayo/openapi-sync), built with Next.js and Tailwind CSS.

## Features

- 🎨 **Modern Design**: Beautiful red-themed UI with smooth animations
- 🌙 **Dark Mode**: Full dark mode support with next-themes
- 📚 **Comprehensive Docs**: Complete documentation with sidebar navigation
- 💡 **Interactive Examples**: Real-world code examples with syntax highlighting
- 🔥 **Validation Showcase**: Highlighting Zod, Yup, and Joi support
- 🚀 **Fast & Optimized**: Built with Next.js 14 App Router for optimal performance
- 📱 **Fully Responsive**: Mobile-first design that works on all devices
- ♿ **Accessible**: WCAG compliant with proper contrast ratios
- 🔗 **Type-Safe Routing**: route-sage integration for type-safe navigation
- ⚡ **SEO Optimized**: Proper meta tags and semantic HTML

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate type-safe routes
npm run routes:generate

# Run linter
npm run lint
```

Visit `http://localhost:3000` to view the website in development mode.

## Project Structure

```
website/
├── app/                      # Next.js app directory (App Router)
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles and Tailwind
│   ├── docs/                # Documentation section
│   │   └── page.tsx         # Docs page
│   └── changelog/           # Changelog section
│       └── page.tsx         # Changelog page
│
├── components/              # React components
│   ├── Hero.tsx            # Hero section with CTA
│   ├── Features.tsx        # Features grid showcase
│   ├── Installation.tsx    # Installation instructions
│   ├── QuickStart.tsx      # Quick start guide
│   ├── UseCases.tsx        # Use cases examples
│   ├── Examples.tsx        # Code examples showcase
│   ├── CTA.tsx             # Call-to-action section
│   ├── Navbar.tsx          # Navigation bar with theme toggle
│   ├── Footer.tsx          # Footer with links
│   ├── ThemeProvider.tsx   # Dark mode provider
│   ├── ThemeToggle.tsx     # Theme switcher component
│   └── docs/               # Documentation components
│       ├── DocsLayout.tsx  # Docs page layout with sidebar
│       ├── DocsContent.tsx # Docs content sections
│       └── CodeBlock.tsx   # Syntax highlighted code blocks
│
├── lib/                     # Utility libraries
│   └── routes.ts           # Type-safe routing with route-sage
│
├── public/                  # Static assets
│   ├── favicon.ico         # Favicon
│   └── favicon.png         # PNG favicon
│
├── route-sage.config.json  # Route generation config
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── next.config.mjs         # Next.js configuration
└── package.json            # Dependencies and scripts
```

## Technologies Used

- **Framework**: [Next.js 14](https://nextjs.org/) - React framework with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) - Dark mode support
- **Routing**: [route-sage](https://www.npmjs.com/package/route-sage) - Type-safe routing
- **Syntax Highlighting**: [Prism.js](https://prismjs.com/) - Code syntax highlighting

## Key Pages

The website consists of the following main pages:

### Home Page (`/`)

- Hero section with main CTA
- Features showcase (8 key features)
- Installation instructions with package manager tabs
- Quick Start guide (3-step process)
- Use Cases examples
- Comprehensive code examples
- Final CTA section

### Documentation (`/docs`)

- Sidebar navigation with sections
- Complete API documentation
- Configuration examples
- Validation setup guides
- Troubleshooting section
- Scrollspy for active section highlighting

### Changelog (`/changelog`)

- Version history with release notes
- Semantic versioning badges
- Grouped by release type (major/minor/patch)

## Development

### Theme System

The website uses `next-themes` for dark mode:

- Light mode: White backgrounds with red accents
- Dark mode: Dark gray backgrounds with lighter red accents
- Automatic system preference detection
- Manual toggle via theme switcher in navbar

### Routing

Type-safe routes are managed with `route-sage`:

```typescript
import routes from "@/lib/routes";

// Usage
<Link href={routes.docs().url}>Documentation</Link>;
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Contributors

A special thanks to the following contributors for their valuable work on this project:

<a href="https://github.com/akintomiwa-fisayo">
  <img src="https://github.com/akintomiwa-fisayo.png" width="50" height="50" alt="Fisayo Akintomiwa" style="border-radius: 50%;" />
</a>
<a href="https://github.com/akintomiwaopemipo">
  <img src="https://github.com/akintomiwaopemipo.png" width="50" height="50" alt="Opemipo Akintomiwa" style="border-radius: 50%;" />
</a>

## License

This project is licensed under the ISC License - see the LICENSE file in the root directory.

## Links

- [Main Repository](https://github.com/akintomiwa-fisayo/openapi-sync)
- [NPM Package](https://www.npmjs.com/package/openapi-sync)
- [Documentation](/docs)

## Support

If you have any questions or need help, please:

- Check the [documentation](/docs)
- Open an [issue](https://github.com/akintomiwa-fisayo/openapi-sync/issues)
- Star the project on [GitHub](https://github.com/akintomiwa-fisayo/openapi-sync)

### Donate / Support the Project

If you'd like to support the website and library financially, you can do so via:

- GitHub Sponsors: https://github.com/sponsors/akintomiwa-fisayo
- Open Collective (placeholder): https://opencollective.com/fisayo-akintomiwa
- Patreon (placeholder): https://patreon.com/openapi_sync
- PayPal (placeholder): https://paypal.me/yourname

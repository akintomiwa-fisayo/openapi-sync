# Contributing to OpenAPI Sync Website

Thank you for considering contributing to the OpenAPI Sync website! This document provides guidelines for contributing.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Git

### Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/openapi-sync.git
   cd openapi-sync/website
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-new-section`
- `fix/navigation-bug`
- `docs/update-readme`
- `style/improve-mobile-layout`

### Making Changes

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test your changes locally
4. Commit your changes:

   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

### Commit Messages

Follow these guidelines:

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters
- Reference issues and pull requests when relevant

Examples:

```
feat: Add new examples section
fix: Correct navigation menu on mobile
docs: Update installation instructions
style: Improve hero section layout
```

## Code Style

### TypeScript

- Use TypeScript for all new components
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable names

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

Example:

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export default function Button({
  label,
  onClick,
  variant = "primary",
}: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {label}
    </button>
  );
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow mobile-first approach
- Keep custom CSS minimal
- Use consistent spacing and colors

### File Structure

```
components/
├── ui/              # Reusable UI components
├── sections/        # Page sections
└── docs/           # Documentation components
```

## Testing

Before submitting a PR:

1. Test on different screen sizes
2. Check for console errors
3. Test all interactive elements
4. Verify links work correctly
5. Check accessibility

## Pull Request Process

1. **Update Documentation**: If you've added features, update the README
2. **Test Thoroughly**: Ensure all changes work as expected
3. **Keep PRs Focused**: One feature/fix per PR
4. **Add Screenshots**: For UI changes, include before/after screenshots
5. **Write Clear Descriptions**: Explain what and why

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Style/UI improvement

## Testing

How has this been tested?

## Screenshots

If applicable, add screenshots

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tested on mobile and desktop
```

## Areas for Contribution

### High Priority

- Improving accessibility
- Adding more examples
- Performance optimization
- Mobile responsiveness
- Documentation improvements

### Good First Issues

- Fixing typos
- Improving error messages
- Adding code comments
- Updating dependencies
- Writing tests

### Feature Requests

- Interactive playground
- Dark mode
- Search functionality
- Internationalization
- Video tutorials

## Design Guidelines

### Colors

Follow the existing color scheme:

- Primary: Blue (#0ea5e9)
- Secondary: Cyan (#06b6d4)
- Text: Gray (#111827)
- Background: White/Gray-50

### Typography

- Headings: Bold, clear hierarchy
- Body text: Readable, adequate line height
- Code: Monospace font (font-mono)

### Spacing

Use Tailwind's spacing scale:

- Small gaps: 4, 6, 8
- Medium gaps: 12, 16
- Large gaps: 20, 24, 32

### Responsive Design

Test at these breakpoints:

- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px
- Large: 1440px

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Review the main repository README

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Thank You!

Your contributions make this project better. We appreciate your time and effort! 🎉

# Vite Boilerplate

A modern, lightweight boilerplate for Vanilla JavaScript projects using Vite. This template comes pre-configured with essential development tools for code quality and consistency.

## Features

- ⚡️ [Vite](https://vitejs.dev/) - Lightning fast build tool and development server
- 🎨 [Prettier](https://prettier.io/) - Code formatting
- 📏 [ESLint](https://eslint.org/) - JavaScript linting
- 💅 [Stylelint](https://stylelint.io/) - CSS linting
- 🐶 [Husky](https://typicode.github.io/husky/) - Git hooks
- 📋 [lint-staged](https://github.com/okonet/lint-staged) - Run linters on git staged files

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone [your-repository-url]
cd vite-boilerplate
```

or

```bash
npx degit kristianDKAndersen/vite-boilerplate.git your-project-name
cd your-project-name
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

### Building for Production

Build the project:

```bash
npm run build
# or
yarn build
```

Preview the production build:

```bash
npm run preview
# or
yarn preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with auto-fix
- `npm run lint:style` - Run Stylelint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run prepare` - Set up Husky git hooks

## Code Quality Tools

### ESLint

- Configuration: Uses `@eslint/js` for modern JavaScript linting
- Run: `npm run lint`

### Stylelint

- Configuration: Uses `stylelint-config-standard`
- Supports CSS and Vue files
- Run: `npm run lint:style`

### Prettier

- Version: 3.3.3
- Run: `npm run format`

### Husky and lint-staged

- Automatically runs linters and formatters on staged files before commits
- Ensures code quality standards are maintained throughout the development process

## Contributing

1. Ensure you have installed all dependencies
2. Make your changes
3. Run linters and formatters before committing:

```bash
npm run format
npm run lint
npm run lint:style
```

## License

This project is private as specified in package.json.

## Version

Current version: 0.0.0

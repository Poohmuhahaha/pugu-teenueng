# Contributing to Pugu

We welcome contributions! Pugu is built as a local-first productivity tool, and community contributions are key to making it better.

## Development Setup

1. Fork the repository and clone it locally.
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and set required secrets.
4. Start the database: `docker-compose up -d db`
5. Run migrations: `pnpm --filter @pugu/api exec prisma migrate dev`
6. Start development servers: `pnpm dev` (This will start the web, api, admin, and landing apps).

## Pull Requests

1. Create a feature branch (`git checkout -b feature/your-feature-name`).
2. Implement your changes.
3. Ensure the project still builds (`pnpm build`) and linting passes (`pnpm lint`).
4. Commit your changes with descriptive, conventional commit messages.
5. Push to your fork and submit a Pull Request against the `main` branch.

## Code Style

- We use Prettier for formatting and ESLint for linting.
- Follow the existing code style in the repository.

## License

By contributing to Pugu, you agree that your contributions will be licensed under the AGPL-3.0 License.

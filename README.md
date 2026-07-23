# Yukthi EMail-Archive-UI

A modern, high-performance web application for managing and interacting with an email archiving system. Built with React 19, TypeScript, and Vite, it offers a robust set of features for searching, viewing, and auditing archived emails, as well as managing users, domains, and security settings.

[![Discord](https://img.shields.io/discord/29zTxvque?label=Discord&logo=discord&logoColor=white&color=5865F2)](https://discord.gg/29zTxvque)

> 💬 **Join our community on Discord:** [discord.gg/29zTxvque](https://discord.gg/29zTxvque) — ask questions, report bugs, share ideas, and get involved.

## 🔗 Related Projects

| Project | Description |
| --- | --- |
| [EMailArchive-UI](https://github.com/Yukthi-Systems/EMailArchive-UI) | Frontend UI dashboard |
| [RMQ-Archive-Parser](https://github.com/Yukthi-Systems/RMQ-Archive-Parser) | RabbitMQ email archive parser |
| [Archive-Admin-API](https://github.com/Yukthi-Systems/Archive-Admin-API) | Backend administration API |
| [IMAP-Sync](https://github.com/Yukthi-Systems/IMAP-Sync) | IMAP sync utility |
| [Archive-Email-Downloader](https://github.com/Yukthi-Systems/Archive-Email-Downloader) | Email downloader worker |
| [Archive-Main-Worker-RMQ](https://github.com/Yukthi-Systems/Archive-Main-Worker-RMQ) | Main worker processing queue |
| [Archive-Dedupe-Handler-RMQ](https://github.com/Yukthi-Systems/Archive-Dedupe-Handler-RMQ) | Queue deduplication handler |
| [RMQ-Archive-Export](https://github.com/Yukthi-Systems/RMQ-Archive-Export) | Archive exporter worker |

## 🚀 Features

- **Advanced Archive Search:** Powerful filtering (Sender, Recipient, Subject, Content, Date Range) with high-performance results.
- **Email Previewer:** Specialized `.eml` parser with support for inline images and attachments.
- **Security First:** Integrated 2-Factor Authentication (TOTP) and Role-Based Access Control (RBAC).
- **Domain & User Management:** Scalable administrative tools for managing multiple domains and users.
- **Audit Logs:** Comprehensive logging for all security and administrative actions.
- **Modern UI/UX:** Built with Radix UI primitives and Tailwind CSS for a premium, accessible experience.
- **State & Data Management:**
  - **TanStack Query** for efficient asynchronous data fetching and caching.
  - **Jotai** for atomic, flexible global state management.

## 🛠️ Tech Stack

- **Core:** React 19, ReactDOM 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0+, Radix UI
- **State Management:** TanStack Query, Jotai
- **Forms & Validation:** React Hook Form, Yup, Hookform Resolvers

## 📦 Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm (or yarn/pnpm/bun)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Yukthi-Systems/EMailArchive-UI
   cd EMailArchive-UI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration:
   Copy the example environment file and configure your settings:
   ```bash
   cp .env.example .env
   ```

   The `VITE_*` variables configure a browser application and are therefore
   public in the built JavaScript. `VITE_API_KEY` is supported only for
   compatibility as a public client identifier; it must not grant access by
   itself. Do not put passwords, private API keys, or other credentials in
   `.env` variables with this prefix. The API and export services must
   authenticate the signed-in user and enforce authorization server-side.

## 💻 Development

To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## 🏗️ Building for Production

To create a production-ready build:
```bash
npm run build
```

This command runs the TypeScript compiler (`tsc`) to check for errors and then uses Vite to build the optimized assets.

## 🧹 Code Quality

This project uses **ESLint** and **Prettier** to maintain code quality and consistent formatting.

- **Linting:** Check for code issues.
  ```bash
  npm run lint
  ```

- **Formatting:** Auto-format code using Prettier.
  ```bash
  npm run format
  ```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request — it covers the fork-and-PR workflow, branch naming, commit style, and what CI checks must pass.

Found a bug or have a feature request? [Open an issue](https://github.com/Yukthi-Systems/EMailArchive-UI/issues/new/choose).

## 🔒 Security

If you discover a security vulnerability, **do not open a public issue**. Please follow the responsible disclosure process in [SECURITY.md](SECURITY.md).

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this standard.

## 📄 License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License version 3 as published by the Free Software Foundation. See the [LICENSE](LICENSE) file for more details.

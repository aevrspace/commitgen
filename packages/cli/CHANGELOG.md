# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.1](https://github.com/aevrHQ/commitgen/compare/v0.3.0...v0.3.1) (2025-12-10)


### Features

* Add /api/auth/me endpoint to retrieve authenticated user details. ([eff7b7d](https://github.com/aevrHQ/commitgen/commit/eff7b7d3b0a14ab451be9823540ba784e7267191))
* Add CLI login command, web dashboard with authentication, new API routes, and data models. ([381de90](https://github.com/aevrHQ/commitgen/commit/381de9003b2da69116e518317f71a1491a94ab4b))
* Add global environment variables and expand build outputs to include Next.js artifacts. ([66eb926](https://github.com/aevrHQ/commitgen/commit/66eb926f9a3b80d35d76432bc2260d079ce4b324))
* Add Privacy Policy and Terms of Service pages and update homepage footer links. ([e0b76cb](https://github.com/aevrHQ/commitgen/commit/e0b76cbd460328d1da915dcde359b89edb48243e))
* Add PWA icons and comprehensive metadata for SEO and social sharing. ([d1e5e1b](https://github.com/aevrHQ/commitgen/commit/d1e5e1bb6d0fb204f7bcdd60980e847d319dcaad))
* implement a modular email service with support for Nodemailer, ZeptoMail, and Resend, including ZeptoMail type definitions. ([a92a08e](https://github.com/aevrHQ/commitgen/commit/a92a08e4551e00035ecdcc7fce54630ce02d5959))
* implement new CommitGen landing page and update repository branding. ([5cd3e7a](https://github.com/aevrHQ/commitgen/commit/5cd3e7a9505f8908bb60b831f93ec45d700e0c38))
* Introduce custom app theme for UI components and enhance login email template. ([ff1dd07](https://github.com/aevrHQ/commitgen/commit/ff1dd0750100e520005e637798fdbf265950ee52))
* Move Navbar and Footer components to layout and integrate Next.js top loader. ([9a28216](https://github.com/aevrHQ/commitgen/commit/9a28216777ca067d0ba4d709532f1a2443447bc0))
* Narrow global content width, integrate Tailwind CSS Typography, and add site section utilities. ([c08ea4d](https://github.com/aevrHQ/commitgen/commit/c08ea4db1d60023dcc72b2c27ad2c73778f3a041))
* **web:** add Next.js web application package to monorepo ([f546ed8](https://github.com/aevrHQ/commitgen/commit/f546ed8014178dff4970d54bf61f4bb4f19c49fd))


### Code Refactoring

* Extract dashboard login, verification, and main view into separate components, leveraging persisted auth state. ([8453322](https://github.com/aevrHQ/commitgen/commit/8453322981336b491babbe919240db3b910bcdd3))
* Migrate Tailwind CSS `gray` and `tw-modernblack` classes to `neutral` color palette. ([cc69639](https://github.com/aevrHQ/commitgen/commit/cc69639c5869bd6306d474b3bf91e3e14b535b99))
* Remove `useEffect` for initial step determination, deriving the current view from the authentication token. ([b6ddc80](https://github.com/aevrHQ/commitgen/commit/b6ddc8011b15cdc968e3c41678408a5c0070d665))
* Reorder `handleLogout` function definition ([2e6a51d](https://github.com/aevrHQ/commitgen/commit/2e6a51d41f0aa6103f64c1dacc4ca09aa83d2348))
* Replace custom spinner divs with the shared Loader component in Card and Dashboard. ([27f2902](https://github.com/aevrHQ/commitgen/commit/27f2902868a3cb3f15112c6eb3c82b2646d51baa))


### Documentation

* Expand README with detailed project description, features, tech stack, and comprehensive usage instructions. ([757e6d6](https://github.com/aevrHQ/commitgen/commit/757e6d6c8d75200ed2083cbe4f34b41cb567b5cb))
* Update README with new frontend framework versions and backend database. ([4d1967a](https://github.com/aevrHQ/commitgen/commit/4d1967a5437c06e46853bbe66dac30e8e3f62009))


### Chores

* **monorepo:** restructure into monorepo with turbo and workspaces ([2b382c8](https://github.com/aevrHQ/commitgen/commit/2b382c849cef90e61931b031ab5f6234a1b95767))
* Rename `pipeline` to `tasks` in turbo.json. ([e9b1358](https://github.com/aevrHQ/commitgen/commit/e9b1358bc0142c151f01e924dd081b24769df479))
* update application title and description metadata ([03a0deb](https://github.com/aevrHQ/commitgen/commit/03a0deb518fc1e20f55da51cf088091df95367a1))
* Update default API URLs from localhost to the production domain. ([3cbeec9](https://github.com/aevrHQ/commitgen/commit/3cbeec9051f102acd2e688d71b99a8dd6ec3e861))

## [0.3.0](https://github.com/aevrHQ/commitgen/compare/v0.2.6...v0.3.0) (2025-11-14)


### Chores

* **repo:** update github repository urls ([a3d8f9f](https://github.com/aevrHQ/commitgen/commit/a3d8f9f55186b42bfb8ba31ca2cbf8887ba70692))

### [0.2.6](https://github.com/aevrHQ/commitgen/compare/v0.2.5...v0.2.6) (2025-11-10)


### Build System

* **tsconfig:** enable json module resolution ([ba7517b](https://github.com/aevrHQ/commitgen/commit/ba7517b5ed47562c0f2d66847225aeee8413dc24))

### [0.2.5](https://github.com/aevrHQ/commitgen/compare/v0.2.4...v0.2.5) (2025-11-10)


### Code Refactoring

* **version:** simplify package version retrieval ([d3294c8](https://github.com/aevrHQ/commitgen/commit/d3294c8482443160cb130439500bacbc7d7a8894))

### [0.2.4](https://github.com/aevrHQ/commitgen/compare/v0.2.3...v0.2.4) (2025-11-10)


### Code Refactoring

* **cli:** load version from package.json ([ee4b1fe](https://github.com/aevrHQ/commitgen/commit/ee4b1feb9cc6d21631681d97b7ec41d5cee52cbd))

### [0.2.3](https://github.com/aevrHQ/commitgen/compare/v0.2.2...v0.2.3) (2025-11-10)


### Features

* **cli:** add loading indicator for AI generation ([626ec95](https://github.com/aevrHQ/commitgen/commit/626ec95b40f9af43985b53d24076fadbe64ee8f3))
* **model:** add --model flag for runtime selection ([52cbefa](https://github.com/aevrHQ/commitgen/commit/52cbefaafc484690facffd0d10455effba599ab2))
* **process:** add graceful shutdown handler ([007cc6f](https://github.com/aevrHQ/commitgen/commit/007cc6f22fb0b3e2c1f8bb897cfaa7edb65e5b2b))


### Bug Fixes

* **ai:** handle AI provider overload errors ([ccc8532](https://github.com/aevrHQ/commitgen/commit/ccc85326742899a6be2f54878fd5397c696cbed8))

### [0.2.2](https://github.com/aevrHQ/commitgen/compare/v0.2.1...v0.2.2) (2025-11-04)


### Code Refactoring

* refactor code ([7483ebd](https://github.com/aevrHQ/commitgen/commit/7483ebd22e1c622484c89c96424268b73cf76b73))

### [0.2.1](https://github.com/aevrHQ/commitgen/compare/v0.2.0...v0.2.1) (2025-11-04)


### Documentation

* **warp:** add WARP.md project guide ([f9d6f7e](https://github.com/aevrHQ/commitgen/commit/f9d6f7e55dbc8ff9b0733033e1003edebb654a31))

## [0.2.0](https://github.com/aevrHQ/commitgen/compare/v0.1.1...v0.2.0) (2025-11-04)


### ⚠ BREAKING CHANGES

* **cli, core:** Major version update required

### Features

* **cli, core:** default AI, update option, refactor utils ([9ef3056](https://github.com/aevrHQ/commitgen/commit/9ef3056fc8dbe5f8054c38e43e860a9240d71cc9))
* **commit-analysis, utils:** add commit history analyzer utility; introduce git analysis utilities; implement commit pattern detection; add commit history and related utilities ([a928dad](https://github.com/aevrHQ/commitgen/commit/a928dad5454cad662c71b67be5888f0954670074))
* **core, analysis:** introduce commit analysis and issue tracking; add commit history and multi-commit analysis; add core utilities for commit processing; extract commit analysis to dedicated utilities ([a40ad26](https://github.com/aevrHQ/commitgen/commit/a40ad267e898451211194bec0d2baaf18154106f))
* **types:** add interfaces for enhanced commit features ([ffdb370](https://github.com/aevrHQ/commitgen/commit/ffdb370d8823fe8fd0dfc75f1d67ff2dd9e8d009))


### Documentation

* **readme:** add new features and cli override flags; document commitgen new capabilities; update cli usage examples and features ([4ebccb2](https://github.com/aevrHQ/commitgen/commit/4ebccb24517bd5ee5d927ac5f6a513ebd9e96958))


### Chores

* **release:** bump version to 0.2.0 ([720b147](https://github.com/aevrHQ/commitgen/commit/720b1474543f41b4a3857efb4715e05ff238dd3e))

### [0.1.1](https://github.com/aevrHQ/commitgen/compare/v0.1.0...v0.1.1) (2025-11-04)


### Features

* **core, ai:** add utility to combine commit messages; implement combining of ai suggestions; introduce commit message consolidation ([87da203](https://github.com/aevrHQ/commitgen/commit/87da203876129fc615e45fbcb61bcdb4e2dae38b))

## [0.1.0](https://github.com/aevrHQ/commitgen/compare/v0.0.5...v0.1.0) (2025-11-03)


### Features

* **config:** prompt for api key on first use ([5ba3e50](https://github.com/aevrHQ/commitgen/commit/5ba3e504b93475c307cc1044beb53130a5d9c4d7))
* **project:** initialize comprehensive README and project structure ([8bde3ed](https://github.com/aevrHQ/commitgen/commit/8bde3edd930d019e135c5ca46e7b6afddbf48af0))

### [0.0.5](https://github.com/aevrHQ/commitgen/compare/v0.0.4...v0.0.5) (2025-11-03)


### Chores

* update dependencies ([975e3c2](https://github.com/aevrHQ/commitgen/commit/975e3c26612aa96136053f26b3324d04c068d3cc))

### [0.0.4](https://github.com/aevrHQ/commitgen/compare/v0.0.3...v0.0.4) (2025-11-03)


### ⚠ BREAKING CHANGES

* Major version update required

### Features

* add feature ([dee5eb7](https://github.com/aevrHQ/commitgen/commit/dee5eb7af0dd1c23ac86d50ccee9595155bf1ea8))

### [0.0.3](https://github.com/miracleonyenma/untools-starter/compare/v0.0.2...v0.0.3) (2025-11-03)

### 0.0.2 (2025-11-03)

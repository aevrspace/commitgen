# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.1](https://github.com/aevrHQ/commitgen/compare/v0.4.0...v0.4.1) (2026-01-10)


### Features

* **callback:** Implement payment callback page . ([77ca1cb](https://github.com/aevrHQ/commitgen/commit/77ca1cb19c09fbf5fb98018ff036ef472329bb25))
* **cli,dashboard:** Add dashboard command and CLI token authentication ([8c74b52](https://github.com/aevrHQ/commitgen/commit/8c74b52edf784b4a8238888cd59db65c952914ae))
* **content:** Update currency and payment integration documentation with latest changes. . ([c6f23ba](https://github.com/aevrHQ/commitgen/commit/c6f23baa946b0147f47ebf459f894cd72bd40a34))
* **db:** Migrate WalletTransaction model to Transaction model and related models. ([eb12c09](https://github.com/aevrHQ/commitgen/commit/eb12c090a69bd15183bf8ee516c09d790ff45f68))

## [0.4.0](https://github.com/aevrHQ/commitgen/compare/v0.3.4...v0.4.0) (2026-01-10)


### Features

* add configuration section to the landing page detailing free starter and BYOK API key options. ([f850240](https://github.com/aevrHQ/commitgen/commit/f850240824fd4f7127815de9f8c8e8de94430356))
* add documentation and guide for obtaining a Google AI API key. ([8639606](https://github.com/aevrHQ/commitgen/commit/8639606116c9134c88d481b1fd680ae396a3162c))
* **api,wallet:** Add diff processing and improve credit validation ([4f4442f](https://github.com/aevrHQ/commitgen/commit/4f4442fe753d08120fe1e1d1a4c7e7ef3b6ebba1))
* **currency:** Add multi-currency support with exchange rates and formatting ([6b3a301](https://github.com/aevrHQ/commitgen/commit/6b3a30199e44f979b1b26fb9c8d9ede73b665972))
* **header:** Add user menu dropdown with authentication state ([9525a93](https://github.com/aevrHQ/commitgen/commit/9525a93ecf7a93f28bc21c3bf37dbe35803ec58e))
* **models:** Add credits calculator and adjust wallet service to handle tiered pricing. ([d25f8ec](https://github.com/aevrHQ/commitgen/commit/d25f8ecc8854a3c103f3470637f72dbe0a90d564))
* **payment:** implement dynamic currency rates and Paystack fee calculation ([0df0ad1](https://github.com/aevrHQ/commitgen/commit/0df0ad1e7dbc22d9fcc5b1b2141f3139b25edf30))
* **payment:** Integrate Paystack and 100Pay payment gateways with wallet system ([0545746](https://github.com/aevrHQ/commitgen/commit/0545746a54635ad7bba3fa66d3e3ed674163c4c5))
* **transactions:** Add transaction history and webhook event logging ([435b393](https://github.com/aevrHQ/commitgen/commit/435b3938ff15218727192032a1122b736bf5c8eb))
* **wallet,dashboard:** Add wallet service and user statistics dashboard ([1ee05b9](https://github.com/aevrHQ/commitgen/commit/1ee05b9a38e037ca4cd2cbffe2aaa65f7fee30b7))
* **webhook,currency:** Add processing status and improve parameter handling ([681b9bc](https://github.com/aevrHQ/commitgen/commit/681b9bce15fd45bd5073a41bf7301dd3aebf2b86))
* **web:** Replace security warning and troubleshooting sections with InfoBox component. ([773397f](https://github.com/aevrHQ/commitgen/commit/773397f95be643bb6ce3079f7c2e6e1669c4fbc4))


### Bug Fixes

* **webhooks,payment:** Make webhook event logging non-blocking and improve error handling ([f123953](https://github.com/aevrHQ/commitgen/commit/f12395342160d938cb56a35396775263e2c30c57))


### Code Refactoring

* **currency:** optimize useCurrency hook with destructured store values ([1335865](https://github.com/aevrHQ/commitgen/commit/1335865b82963ed2f3a0a3f4cae253af3f923136))
* **webhooks:** Extract webhook event logging into dedicated service ([9f19401](https://github.com/aevrHQ/commitgen/commit/9f19401e2b537cfe9e7a29dd146a8edc7a76cfcd))

### [0.3.4](https://github.com/aevrHQ/commitgen/compare/v0.3.3...v0.3.4) (2025-12-11)


### Features

* Add `commitgen` as the default provider option and integrate a login flow for authentication. ([06c1404](https://github.com/aevrHQ/commitgen/commit/06c1404b70a6208a93d0bd74ad37ae0049ba5246))
* add interactive terminal demo component to the landing page. ([e161676](https://github.com/aevrHQ/commitgen/commit/e161676915b3e5bc7b25aeaeac312d6af42a07c3))
* left align text within the terminal demo body ([b85f44f](https://github.com/aevrHQ/commitgen/commit/b85f44fccc840de2fb4717eff8bf9ab2d6e86818))


### Bug Fixes

* explicitly specify User model for userId population. ([339808e](https://github.com/aevrHQ/commitgen/commit/339808e58bc4894ec69d7d41b23b81dd7a24fabd))

### [0.3.3](https://github.com/aevrHQ/commitgen/compare/v0.3.2...v0.3.3) (2025-12-11)


### Features

* update default API endpoint to production and add CLI release scripts ([412aadf](https://github.com/aevrHQ/commitgen/commit/412aadfdfe88deb29faf0e7a20792c198180df10))

### [0.3.2](https://github.com/aevrHQ/commitgen/compare/v0.3.1...v0.3.2) (2025-12-11)


### Features

* **cli:** Update API URLs to use http://localhost:3000 by default. ([78f4545](https://github.com/aevrHQ/commitgen/commit/78f4545850e720f88673625684d194ccbb0e070e))


### Chores

* **route:** Updated email notice color in login code email. ([9f502c1](https://github.com/aevrHQ/commitgen/commit/9f502c1427f24f6db3991727c6848919a554d990))

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

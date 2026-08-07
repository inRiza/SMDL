# Graph Report - .  (2026-08-07)

## Corpus Check
- Corpus is ~39,222 words - fits in a single context window. You may not need a graph.

## Summary
- 800 nodes · 1580 edges · 36 communities (26 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.71)
- Token cost: 23,921 input · 1,984 output

## Community Hubs (Navigation)
- Org Auth Helpers
- App Shell Layout
- Org Detail Wizard
- Prisma TELLS Core
- Avatars Chat UI
- Frontend Dependencies
- Org List Cards
- Backend Auth Entry
- Frontend TSConfig
- Document API Layer
- Backend Dependencies
- Document Detail UI
- Shadcn Components Config
- Wiki Search Filter
- Landing Page Sections
- User API Layer
- Product Docs Design
- Auth Org Seeds
- App Placeholder Pages
- Backend TSConfig
- Wiki Document Pages
- Wiki Table Cards
- Document LER Types
- Wiki Search Context
- Document Seed Data
- Next Auth Middleware
- DB Setup Scripts
- Backend Env Config
- ESLint Config
- Next Config
- PostCSS Config
- Access Control Docs
- Audit Monitoring Docs
- Auth Module Docs
- Document Repo Docs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 87 edges
2. `getRequestUserId()` - 20 edges
3. `compilerOptions` - 16 edges
4. `OrganizationRepository` - 15 edges
5. `OrganizationService` - 14 edges
6. `Button()` - 14 edges
7. `OrganizationController` - 13 edges
8. `getApiBeOrganizations()` - 13 edges
9. `fetchApi()` - 13 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Technical Approach & System Design` --references--> `PostgreSQL Database`  [EXTRACTED]
  doc/SKILLS.md → be/docker-compose.yml
- `LerStatusBadge()` --calls--> `cn()`  [EXTRACTED]
  fe/app/(app)/documents/[id]/components/document-detail-sections.tsx → fe/lib/utils.ts
- `OrganizationTypeBadge()` --calls--> `cn()`  [EXTRACTED]
  fe/app/(app)/organizations/components/organization-list.tsx → fe/lib/utils.ts
- `AvatarBadge()` --calls--> `cn()`  [EXTRACTED]
  fe/components/ui/avatar.tsx → fe/lib/utils.ts
- `DocumentDetailPage()` --calls--> `fetchDocumentById()`  [EXTRACTED]
  fe/app/(app)/documents/[id]/page.tsx → fe/lib/api/document/route.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SMDL Core Architecture** — smdl_auth_module, smdl_access_control_module, smdl_document_repository, smdl_ler_service, smdl_tells_assistant, smdl_audit_log [EXTRACTED 1.00]
- **SMDL Technology Stack** — tech_hono, tech_nextjs, be_postgres, tech_pgvector, tech_minio, tech_bullmq, tech_qwen, tech_bge_m3 [EXTRACTED 1.00]
- **SMDL AI Processing Pipeline** — smdl_ler_service, smdl_tells_assistant, tech_qwen, tech_bge_m3, tech_pgvector [INFERRED 0.90]

## Communities (36 total, 10 thin omitted)

### Community 0 - "Org Auth Helpers"
Cohesion: 0.05
Nodes (43): getRequestUserId(), unauthorizedResponse(), getMemberDisplayName(), MemberNameSource, getActorName(), OrganizationController, buildOrderBy(), buildWhere() (+35 more)

### Community 1 - "App Shell Layout"
Cohesion: 0.06
Nodes (58): inter, metadata, AppSidebar(), BOTTOM_RIGHT_SQUARES, CornerCluster(), CornerClusterProps, CornerRedGrid(), CornerRedGridPair() (+50 more)

### Community 2 - "Org Detail Wizard"
Cohesion: 0.06
Nodes (63): AddNewOrganization(), initialForm, PendingInvite, userInitial(), WizardSummary, AddMemberModal(), EditDocumentModal(), EditOrganizationModal() (+55 more)

### Community 3 - "Prisma TELLS Core"
Cohesion: 0.06
Nodes (41): createPrismaClient(), getPrismaClient(), globalForPrisma, prismaClient, chatWithOllama(), buildCitationSources(), CitationSource, resolveCitationsFromReply() (+33 more)

### Community 4 - "Avatars Chat UI"
Cohesion: 0.06
Nodes (51): MemberAvatar(), MemberAvatarProps, StackedMemberAvatars(), StackedMemberAvatarsProps, AssistantMessage(), ChatAvatar(), formatFileSize(), getDisplayName() (+43 more)

### Community 5 - "Frontend Dependencies"
Cohesion: 0.04
Nodes (44): @base-ui/react, class-variance-authority, clsx, eslint, eslint-config-next, dependencies, @base-ui/react, class-variance-authority (+36 more)

### Community 6 - "Org List Cards"
Cohesion: 0.07
Nodes (30): formatDate(), OrganizationCard(), OrganizationCardProps, OrganizationList(), OrganizationListProps, OrganizationTypeBadge(), OrganizationResults(), OrganizationResultsProps (+22 more)

### Community 7 - "Backend Auth Entry"
Cohesion: 0.09
Nodes (21): app, authMiddleware(), authService, generateSessionToken(), getSessionExpiry(), hashSessionToken(), env, envSchema (+13 more)

### Community 8 - "Frontend TSConfig"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 9 - "Document API Layer"
Cohesion: 0.14
Nodes (12): DocumentController, buildOrderBy(), buildWhere(), DocumentRepository, controller, documentRoute, DocumentService, DocumentListItem (+4 more)

### Community 10 - "Backend Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, hono, @prisma/client, zod, devDependencies, prisma, @types/bun, name (+16 more)

### Community 11 - "Document Detail UI"
Cohesion: 0.13
Nodes (17): DocumentMetadata(), DocumentMetadataProps, DocumentPreview(), DocumentPreviewProps, entityTypeLabel, formatConfidence(), formatDate(), formatFileSize() (+9 more)

### Community 12 - "Shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 13 - "Wiki Search Filter"
Cohesion: 0.16
Nodes (13): DocumentList(), DocumentListProps, formatOptions, SearchFilter(), SearchFilterProps, sortOptions, statusOptions, SearchLoading() (+5 more)

### Community 14 - "Landing Page Sections"
Cohesion: 0.16
Nodes (9): About(), Cta(), Features, Footer(), Hero(), Navbar(), navLinks, Security() (+1 more)

### Community 15 - "User API Layer"
Cohesion: 0.23
Nodes (7): UserController, UserRepository, controller, userRoute, UserService, UserListQueryInput, UserListQuerySchema

### Community 16 - "Product Docs Design"
Cohesion: 0.15
Nodes (16): Docker Compose Configuration, PostgreSQL Database, SMDL Backend README, Product Requirements Document (PRD), Legal Domain Accuracy & Context-Awareness Brain, Technical Approach & System Design, UI Design System, Legal Entity Recognition (LER) Service (+8 more)

### Community 17 - "Auth Org Seeds"
Cohesion: 0.18
Nodes (8): prisma, SEED_USER_ID, seedUsers, prisma, SEED_ORG_IDS, SEED_USERS, SeedMember, seedMembers

### Community 18 - "App Placeholder Pages"
Cohesion: 0.29
Nodes (4): AppHeader(), AppHeaderProps, PagePlaceholder(), PagePlaceholderProps

### Community 19 - "Backend TSConfig"
Cohesion: 0.18
Nodes (10): compilerOptions, baseUrl, jsx, jsxImportSource, paths, strict, types, include (+2 more)

### Community 20 - "Wiki Document Pages"
Cohesion: 0.31
Nodes (9): DocumentDetailPage(), DocumentDetailPageProps, getFilter(), WikiPage(), getApiBeDocuments(), buildQuery(), fetchDocumentById(), fetchDocumentCategories() (+1 more)

### Community 21 - "Wiki Table Cards"
Cohesion: 0.24
Nodes (9): formatDate(), formatFileSize(), mapFileFormatToIcon, statusClass, statusLabel, WikiListHeader(), WikiListItem(), WikiListItemProps (+1 more)

### Community 22 - "Document LER Types"
Cohesion: 0.27
Nodes (8): buildEntities(), toDocumentDetail(), DocumentListItem, DocumentListResponse, DocumentSort, DocumentStatus, LerEntity, LerEntityType

### Community 23 - "Wiki Search Context"
Cohesion: 0.40
Nodes (3): WikiSearchContext, WikiSearchContextValue, WikiSearchProvider()

### Community 26 - "DB Setup Scripts"
Cohesion: 0.67
Nodes (3): db:push script, db:seed script, db:setup script

## Knowledge Gaps
- **220 isolated node(s):** `name`, `dev`, `db:up`, `db:down`, `db:generate` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `App Shell Layout` to `Org Detail Wizard`, `Avatars Chat UI`, `Org List Cards`, `Document Detail UI`, `Wiki Search Filter`, `Wiki Table Cards`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `react` connect `App Shell Layout` to `Frontend Dependencies`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Frontend Dependencies` to `App Shell Layout`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `name`, `dev`, `db:up` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Org Auth Helpers` be split into smaller, more focused modules?**
  _Cohesion score 0.05329593267882188 - nodes in this community are weakly interconnected._
- **Should `App Shell Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.058596491228070174 - nodes in this community are weakly interconnected._
- **Should `Org Detail Wizard` be split into smaller, more focused modules?**
  _Cohesion score 0.06430745814307458 - nodes in this community are weakly interconnected._
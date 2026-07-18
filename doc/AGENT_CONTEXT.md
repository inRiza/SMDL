# Product Requirements Document (PRD)
## Sistem Manajemen Dokumen Legal berbasis Legal Entity Recognition (LER) dengan Kontrol Akses (SMDL)

> This document is derived from the official SRS (v1.0, 2026) for PT. Telekomunikasi Indonesia Tbk.
> It is written for AI coding agents to use as ground-truth context during implementation, code review, and test generation. Treat every `SHALL`/`FR-x`/`NFR` item as a hard requirement unless explicitly marked optional (`MAY`).

---

## 1. Product Summary

**Name:** SMDL (Sistem Manajemen Dokumen Legal)
**Type:** Web-based client-server application (standalone MVP, not dependent on other legal systems)
**Owner:** PT. Telekomunikasi Indonesia Tbk (Telkom)
**Core value proposition:** Centralize legal document storage, search, and access control while using a Legal Entity Recognition (LER) module to auto-extract structured metadata (parties, contract numbers, dates, organizations, document type) from legal documents.

**Replaces:** Legacy SharePoint/Wiki-based legal document handling.

**MVP priority:** Access control and information security first, then document management, then AI-assisted features (LER, SLM search/summarization).

### Core Modules (from component diagram)
| Module | Responsibility |
|---|---|
| **Authentication** | Login/session management |
| **Access Control** | RBAC enforcement, permission management |
| **Document Repository** | Store/retrieve raw documents |
| **Document Retrieval** | Serve document content/metadata to consumers |
| **Search Engine** | Keyword/metadata document search |
| **Summary (SLM Inference)** | Document summarization via Small Language Model |
| **Entity Repository / LER Service** | Store and serve extracted legal entities |

Communication between modules: REST API over HTTPS, JSON payloads, TLS-encrypted. Document exchange formats: PDF, DOCX.

---

## 2. Actors / User Roles (RBAC)

| Role | Permissions |
|---|---|
| **Administrator** | Full system control: configure LER/SLM, manage all user access, manage org structure, view all audit logs, export audit reports |
| **Owner** | Can upload documents (if granted by Administrator); full control over own uploaded documents (update, delete, configure); can create organizations/teams; can only invite other users as **Owner** |
| **Viewer** | Default role; view and search documents only; no upload rights |
| **Auditor** | Read-only access to audit/monitoring dashboard for oversight |

**Key rule:** A user cannot grant/approve their own access changes (DC-5). Access approval must come from someone with the authority to manage it (Owner/Administrator), never self-service.

---

## 3. Functional Modules & Requirements

### 3.1 Authentication & Authorization (Priority: HIGH)
- Login page accessible only to valid accounts.
- Validate username/email + password before granting access.
- Enforce RBAC for all subsequent actions.
- Invalid credentials → reject + show error message.
- Successful login → create session, redirect based on role.
- Logout → terminate session, return to login.
- **All login/logout events must be written to audit log.**

Relevant IDs: `FR-01`..`FR-07`

### 3.2 Legal Document Management (Priority: HIGH)
Upload / view / update / delete / download documents, with mandatory metadata and RBAC enforcement at every action.

Key behaviors:
- Only Owner (or role granted by Admin) can upload.
- Accepted formats: at minimum **PDF and DOCX**. Validate format, size, and file integrity before persisting.
- Required metadata form fields (minimum): title, description, category, organization, + other required fields. All required metadata must be filled before save.
- Each saved document gets a unique **Document ID**.
- System must maintain the link between: document ↔ metadata ↔ owner ↔ organization ↔ LER extraction result.
- On successful upload: **auto-trigger LER extraction** (async allowed).
- On document content update: **re-run LER extraction**; update extracted metadata when done.
- Delete requires confirmation dialog; deletes metadata per data retention policy.
- Download only allowed for users with access rights; log every download.
- Preview document content in-browser when format supports it (no forced download).
- All these events (upload, metadata change, delete, download) → audit log.

Relevant IDs: `FR-08`..`FR-37`

### 3.3 Legal Entity Recognition (LER)
- Automatically extract legal entities from uploaded documents: parties involved, dates, document numbers, organizations, and other legal entity types.
- Runs on upload and on content-modifying updates.
- Must run in an on-premise/local environment — **no document or extracted data may be sent to third-party/external services** (data residency constraint, tied to `DC-10` and `NFR` security requirements).
- LER failures must NOT cause document loss (document persists even if extraction fails) — see reliability requirements.

### 3.4 Document Search
- Search by keyword, metadata, and/or LER extraction results.
- Filtering support for narrowing results.
- Empty results → show a "not found" message (not a blank/broken state).

### 3.5 Document Access Rights Management
- The uploader can explicitly grant/manage access per user and/or per organization/unit.
- Only the uploader (or explicitly authorized users/orgs) can manage or view the document — strict least-privilege enforcement.

### 3.6 Intelligent Assistant — "TELLS" (SLM-based Chatbot) (Priority: MEDIUM)
Natural-language semantic search and Q&A assistant over legal documents.

Key behaviors:
- Chat-style UI; user submits natural-language query.
- Backend routes query to SLM module → semantic search using document metadata + LER extraction results.
- Return top relevant documents with **relevance score** and short summary; explain why a document was recommended, if available.
- Support follow-up questions within the same session; maintain conversational context for the session duration.
- **Strict RBAC enforcement:** TELLS must only search/answer from documents the requesting user can access. Never leak metadata or content of inaccessible documents.
- No relevant result → explicit "not found" message + suggest the user refine/clarify the query.
- Off-topic (non-legal) questions → respond that the query is out of scope for the assistant.
- Documents/queries must stay within internal infrastructure — **no data sent to external SLM/third-party APIs**.
- Every TELLS interaction (query + result) → audit log.

Relevant IDs: `FR-38`..`FR-51`

### 3.7 Organization / Team Management (Priority: MEDIUM)
- Any user can create an organization; creator becomes **Owner** of that org.
- Org creation requires (at minimum) a name; validate before creation; assign unique Org ID.
- Owner can invite other registered users; invitee must accept/decline.
- Owner can view members, remove members (with confirmation) — removal revokes **all** document access tied to that org immediately.
- Owner can change a member's access level within the org (with confirmation before applying).
- Users with sufficient org access can upload documents directly into the organization's shared space, choosing an access rule/policy for that document at upload time.
- Org document upload follows the same metadata/file validation rules as 3.2, and also triggers LER extraction automatically.
- All org lifecycle events (create, invite, member add/remove, access-level change, document upload) → audit log.

Relevant IDs: `FR-52`..`FR-90`

### 3.8 Audit & Monitoring (Priority: HIGH)
- Every sensitive action must be recorded: login/logout, document CRUD, download, access-rights changes, org lifecycle events, TELLS usage, LER runs.
- Minimum fields per audit entry: user identity, activity type, timestamp, IP/device identity (if available), object accessed, success/failure status.
- Logs stored chronologically; **immutable** — normal users cannot edit or delete audit logs.
- Administrator: full audit log access. Auditor: access scoped per granted permissions.
- Support: keyword search, filter by time range, filter by user, filter by activity type.
- Support export of audit log/report in a supported format.
- Audit logging must still occur even if the underlying business action fails (i.e., failures are also auditable events).
- Proper "no access" / "not found" messaging when a query yields nothing or user lacks permission.

Relevant IDs: `FR-91`..`FR-120`

---

## 4. Non-Functional Requirements

### 4.1 Performance (ISO/IEC 25010 – Performance Efficiency)
- Fast landing-page render post-login; responsive document search (no perceptible lag under normal load).
- LER extraction auto-starts immediately after upload but runs without blocking the main UI (treat as background/async job).
- TELLS response time should be reasonable relative to query complexity.
- Efficient CPU/memory/storage usage during document processing, LER, and TELLS operations.
- LER/TELLS processing must not degrade the core service for other concurrent users.
- Must support multiple concurrent users, concurrent uploads, and concurrent TELLS requests within infrastructure capacity, without service failure.
- Must scale with growing document/metadata volume without significant stability impact.

### 4.2 Reliability (ISO/IEC 25010)
- Confirmation dialogs required before destructive actions (delete document/org/member).
- Document persists even if LER extraction fails (no data loss on partial failure).
- Maintain consistency between document and its metadata at all times.
- Failed transactions must roll back (no partial/inconsistent state).
- System must support recovery after service failure; audit logs must remain available/intact post-failure.
- Periodic backup mechanism required per Telkom policy.
- User-facing notification required when a failure prevents completing a requested action.

### 4.3 Security (OWASP ASVS + Telkom Access Control Standard)
- Mandatory authentication before accessing any protected resource.
- Session must be unique per authenticated user; session ends on logout or timeout.
- RBAC enforced and permission-checked on **every** request to documents/services — not just at login.
- Users must never access documents/orgs outside their granted rights.
- All client-server communication over **HTTPS/TLS**.
- Sensitive data encrypted in transit.
- Error messages shown to users must **never** leak internals (no stack traces, no config details).
- All input must be server-side validated; reject malformed input.
- File upload validation: format, size, type, integrity — before persisting.
- Uploaded documents stored only in a secured location, accessible strictly via the system's authorization mechanism.
- LER/SLM processing confined to internal infrastructure — **no external/third-party transmission** of documents or metadata without explicit authorization.
- TELLS must only use documents the requesting user can access as its answer source.
- Audit log integrity protected from tampering by unauthorized users.

### 4.4 Software Quality Attributes (ISO/IEC 25010)
- Consistent UI/navigation across all pages (navbar/sidebar pattern).
- Responsive design: desktop, tablet, mobile.
- Clear, user-understandable error/notification messages (toast-based feedback pattern expected per UI conventions, see §5).
- Modular architecture — new modules/features should not break existing core functions.
- Standardized API-based integration for interoperability with internal Telkom services.
- Portable across supported OS/browser environments without core logic changes.
- Core functions should be independently testable (supports unit/integration testing).
- Architecture must accommodate growth in users/documents without major redesign.

---

## 5. UI/UX Conventions (must be followed by any frontend agent)

- Consistent layout/navigation (navbar or sidebar) across every page.
- Fully responsive: desktop, mobile (HP), tablet.
- Button styling must visually distinguish action intent: **primary**, **secondary**, **danger**.
- Required form fields marked with a **red asterisk (\*)**.
- Validation/error/success feedback delivered via **toast notifications**.
- Destructive or high-impact actions (delete, critical data change) **must** show a confirmation dialog first.
- Visual consistency (spacing, color, typography) maintained across all screens.

### Required Pages
1. Authentication (login)
2. Wiki (main/landing) page
3. Document & organization/team management dashboard
4. Administrator dashboard
5. TELLS chatbot page
6. Document detail page (with LER results)
7. User profile page

---

## 6. Interfaces & Integration Contracts

- **Client-server:** HTTPS only.
- **Inter-service:** RESTful APIs, JSON payloads.
- **HTTP methods:** GET/POST/PUT/DELETE used per standard REST semantics.
- **Sync vs Async:**
  - Synchronous: auth, document search, standard CRUD/data management (needs immediate response).
  - Asynchronous allowed/expected: LER extraction, document summarization, SLM/TELLS heavy processing.
- Every failed request must return a proper status code + error message (machine-parseable and user-presentable).
- Any request touching auth, access-rights changes, document management, or other sensitive activity must be logged to audit log.
- Document interchange formats: **PDF, DOCX** (minimum supported set).
- SLM/LER services: **must be deployable/runnable on-premise** — do not design integrations that assume a third-party cloud AI API for these two modules.

---

## 7. Out of Scope / Explicit Constraints for MVP

- No dependency on external/third-party legal systems — SMDL is self-contained.
- SLM must run locally (on-prem); do not call external LLM/SLM SaaS APIs for document content processing.
- No self-approval of one's own access rights — always requires a role with authority (Owner/Admin) to grant/change access.
- Formal "Aturan Perusahaan" (company rules, §5.5 of SRS) is currently unspecified in the source document — treat as **pending/TBD**, do not assume defaults.

---

## 8. Glossary

| Term | Meaning |
|---|---|
| **SMDL** | Sistem Manajemen Dokumen Legal (this product) |
| **LER** | Legal Entity Recognition — NER-derived module for extracting legal entities from documents |
| **TELLS** | The SLM-based intelligent assistant/chatbot feature (semantic search + summarization + Q&A) |
| **SLM** | Small Language Model, run on-premise |
| **RBAC** | Role-Based Access Control |
| **Owner** | User role with upload + full document/org management rights |
| **Viewer** | Default read-only user role |
| **Auditor** | Role with read access to audit/monitoring data |
| **Administrator** | Role with full system configuration and access-management authority |

---

## 9. Traceability Notes for Agents

- Functional requirement IDs (`FR-1..FR-120`) and non-functional constraint IDs (`DC-x`, `OE-x`, `AS-x`, `DS-x`, `NFR`) trace back 1:1 to the original SRS document (`Draf_SRS_v1_0_0-2.pdf`). When implementing a feature, cite the relevant `FR-x`/`SR-x` in code comments or PR descriptions where useful for review traceability.
- When a requirement is ambiguous (e.g., exact metadata schema, exact access-rule taxonomy, exact SLA numbers), do not invent binding business rules — flag as an open question rather than silently assuming.
# Legal Domain Accuracy & Context-Awareness Brain
## SMDL — LER + TELLS Behavioral Ground Truth

> Third companion document to `AGENT_CONTEXT.md` (PRD — what to build) and `SKILLS.md` (technical approach — how to build it).
> This document defines **how the AI components must behave** to be legally accurate and trustworthy: extraction schema, grounding rules, prompt templates, uncertainty handling, and escalation rules. Treat every `MUST`/`NEVER` as a hard requirement. This is the document an implementation agent should consult when writing prompts, validating LER output, or deciding what TELLS is allowed to say.

---

## 1. Why This Document Exists

LER and TELLS are not generic NER/RAG features — they operate on legal documents where a wrong extraction or a hallucinated answer has real consequences (wrong contract party, wrong expiry date, invented clause). Accuracy here is a **correctness requirement**, not a nice-to-have. This document exists so that:

- The extraction schema matches how Indonesian legal documents are actually structured, not a generic NER template.
- The LLM used for TELLS/LER is constrained by explicit rules, not just "prompted to be careful."
- There is a defined, testable definition of "accurate enough to ship."

---

## 2. Indonesian Legal Document Taxonomy

LER must recognize document type first — extraction logic differs by type. Minimum MVP taxonomy (extend via config, not code changes, as new types appear):

| `document_type` | Typical structure agents should expect | Notes |
|---|---|---|
| `perjanjian` / `kontrak` (agreement/contract) | Para Pihak → Definisi → Objek Perjanjian → Hak & Kewajiban → Jangka Waktu → Force Majeure → Kerahasiaan → Penyelesaian Sengketa → Penutup & Tanda Tangan | Most common; has effective date + expiry/duration |
| `nota kesepahaman` (MoU) | Similar to perjanjian but usually non-binding language, no penalty clause | Watch for "tidak mengikat secara hukum" phrasing — flag as non-binding |
| `addendum` / `amandemen` | References a parent contract number explicitly | **MUST** attempt to resolve and link `parent_document_id`; if unresolvable, flag not fail |
| `surat kuasa` (power of attorney) | Pemberi kuasa / Penerima kuasa, scope of authority, validity period | Distinct party roles — do not conflate with generic "parties" |
| `surat keputusan` (SK / decision letter) | Issuing organization, decision number, effective date, subject | Often internal, single "party" (the org itself) |
| `perjanjian kerjasama` (partnership/cooperation agreement) | Similar to perjanjian, but usually multi-party (3+) | Don't assume exactly 2 parties |
| `unclassified` | — | Valid fallback. Never force a document into a wrong type to satisfy the schema. |

**Rule:** if the model cannot confidently classify `document_type`, it **MUST** return `"unclassified"` rather than guessing the closest-sounding type. A wrong type silently breaks every downstream extraction assumption.

---

## 3. LER Entity Schema (Legal-Accurate, Extended)

The schema in `SKILLS.md` §9 is a good MVP skeleton. This is the domain-accurate superset — implement incrementally, but design the DB/JSON shape to hold all of it from day one so extending later is additive, not a migration nightmare.

```typescript
interface LegalExtraction {
  document_type: DocumentType | "unclassified";
  parties: Array<{
    name: string;
    role: string;          // e.g. "Pihak Pertama", "Pemberi Kuasa", "Penyedia Jasa"
    entity_type: "individual" | "corporate" | "government" | "unknown";
  }>;
  contract_number: string | null;
  parent_document_number: string | null;   // for addendum/amandemen linkage
  dates: {
    signing_date: string | null;           // ISO 8601, null if not found
    effective_date: string | null;
    expiry_date: string | null;
    duration_text: string | null;          // raw text, e.g. "12 (dua belas) bulan" — do NOT compute expiry from this unless effective_date is also known
  };
  organizations: string[];
  governing_law: string | null;            // e.g. "hukum Republik Indonesia"
  dispute_resolution: string | null;       // e.g. "BANI Arbitration", "Pengadilan Negeri Jakarta Selatan"
  contract_value: {
    amount: number | null;
    currency: string | null;
    raw_text: string | null;               // always keep raw source text alongside parsed value
  } | null;
  confidentiality_clause_present: boolean;
  termination_clause_present: boolean;
  location: string | null;
  extraction_confidence: "high" | "medium" | "low";
  extraction_notes: string[];              // model's own flags, e.g. "expiry_date inferred from duration_text, verify"
}
```

**Non-negotiable rules for this schema:**

- **Never compute a derived value the source text doesn't state directly.** If only `duration_text` ("12 bulan sejak tanggal efektif") is present and no explicit expiry date, `expiry_date` stays `null` — do not calculate it, even though it looks trivial. Date arithmetic on ambiguous anchor dates is a common source of wrong legal metadata.
- **`raw_text` alongside every parsed structured value that involves money, dates, or duration.** A human reviewer must be able to verify the parse against the source sentence without opening the whole document.
- **`extraction_confidence` is mandatory, not decorative.** Downstream (search, TELLS) must be able to deprioritize or flag `low`-confidence entities instead of treating everything as ground truth.
- **`extraction_notes` is where the model surfaces its own doubt** ("dua kemungkinan nomor kontrak ditemukan, dipilih yang muncul di kop surat") — this is what makes human review fast instead of a re-read of the whole document.

---

## 4. Context-Awareness Rules for Agents (LER + TELLS)

These apply to any prompt sent to the on-prem LLM for extraction or chat, and to any implementation agent writing those prompts.

1. **Extraction is closed-book.** The model must only extract what's literally present in the provided document text/chunks — never fill gaps using general knowledge of "how Indonesian contracts usually work." If a field isn't stated, the value is `null`, not an inferred default.
2. **Chunking must preserve entity locality.** If a document is split into chunks for the LLM context window, party names/definitions declared at the top of the document (e.g., "PT ABC (selanjutnya disebut 'Pihak Pertama')") must be carried forward into later chunks' context — otherwise the model extracts "Pihak Pertama" as a party name literally, which is wrong. Practical approach: always prepend the first ~500 tokens of the document (where defined terms usually live) to every chunk sent for extraction, not just the chunk's own text.
3. **Amendments/addenda are relational, not standalone.** An `addendum` extraction is incomplete without attempting to resolve which parent contract it modifies. If the parent can't be found in the repository by number, store the reference text as-is and flag it — don't drop it silently.
4. **Multi-party documents are not always 2-party.** Never hardcode "party A / party B" assumptions in prompts or UI; the schema and prompts must handle N parties.
5. **Definitions section governs terminology for the whole document.** If a document defines a term ("selanjutnya disebut 'Perjanjian'"), later LER/TELLS reasoning about that document must resolve the term back to its definition — don't treat defined terms as generic vocabulary.

---

## 5. Prompt Templates

### 5.1 LER Extraction Prompt (refined from `SKILLS.md` §9)

```
You are extracting structured legal metadata from an Indonesian legal document.
Extract ONLY information explicitly stated in the text below. Do not infer,
calculate, or complete missing information using general knowledge.

Rules:
- If a field is not explicitly stated, use null.
- Do not calculate dates from duration text (e.g. do not compute expiry_date
  from "12 bulan" + signing_date). Only fill a date field if that exact date
  is written in the document.
- For contract_value, dispute_resolution, and dates: always include the exact
  source sentence in the corresponding raw_text/notes field.
- If you are uncertain about any field, lower extraction_confidence and explain
  why in extraction_notes. Do not silently guess.
- If document_type cannot be determined with confidence, return "unclassified".

Return ONLY valid JSON matching this schema: <SCHEMA>

Document text:
<CHUNK_WITH_PRESERVED_DEFINITIONS>
```

### 5.2 TELLS RAG System Prompt

```
You are TELLS, a legal document assistant for internal Telkom staff. You answer
questions using ONLY the retrieved document excerpts provided below — never
from general knowledge about law or contracts.

Rules:
- Every factual claim in your answer must cite the source document title/ID.
- If the retrieved excerpts do not contain enough information to answer, say
  so explicitly and suggest the user refine their question. Do not fill gaps
  with general legal knowledge or assumptions.
- If the question is not related to the legal documents in this system
  (off-topic), state that it is out of scope for this assistant.
- You are not providing legal advice or legal opinions — you are summarizing
  and locating information within documents the user has access to. If asked
  for an opinion/recommendation, state that a qualified legal reviewer should
  be consulted.
- Never mention documents, parties, or content outside what was retrieved for
  this specific query, even if you may recall it from earlier in the
  conversation, unless it was retrieved again for this turn.

Retrieved context:
<TOP_N_CHUNKS_WITH_DOCUMENT_TITLES_AND_IDS>

Conversation history:
<SESSION_HISTORY>

User question: <QUERY>
```

**Why the "not legal advice" line matters:** TELLS retrieves and summarizes existing documents — it must never be positioned (even implicitly, via confident tone) as generating a legal opinion. This is a product-liability boundary, not just a UX nicety.

---

## 6. Grounding & Anti-Hallucination Rules

These are enforced at the application layer, not just in the prompt — prompts alone are not reliable enough for this domain.

1. **Citation enforcement:** after the LLM responds, validate that every referenced document ID in the answer actually appears in the retrieved chunk set passed to it. If the model cites a document that wasn't retrieved, treat the response as invalid and retry once with a stricter reminder; if it fails twice, fall back to "not found, please refine your question."
2. **No-context-no-answer:** if hybrid retrieval (see `SKILLS.md` §10) returns zero chunks above a minimum relevance threshold, TELLS must not call the LLM to "try anyway" — return the "not found" message directly. Never let the LLM answer from a near-empty context, since it will fill gaps with plausible-sounding but ungrounded text.
3. **Structured-output validation for LER:** every extraction result is validated against the JSON schema (see §3) before being persisted. Malformed or schema-violating output is retried (max 3 attempts per `SKILLS.md` §11), then marked `ler_failed` — never partially persisted as if it were complete.
4. **Confidence propagates to UI, not just storage.** Document detail page (per `AGENT_CONTEXT.md` §5, required page 6) must visually distinguish `low`-confidence extracted fields (e.g., muted color + "verify" badge) so a human reviewer knows what to check first, instead of treating all extracted fields as equally certain.

---

## 7. Uncertainty & Refusal Behavior

| Situation | Required behavior |
|---|---|
| LER: field not stated in document | `null`, not inferred |
| LER: ambiguous/conflicting values found (e.g. two possible contract numbers) | Pick the more likely one per document convention (e.g., value in the header/kop surat), but log both in `extraction_notes` |
| TELLS: no relevant document found | Explicit "not found" message + suggest refining query (per `AGENT_CONTEXT.md` §3.6) |
| TELLS: relevant document found but doesn't answer the specific question | State that explicitly — do not answer a nearby-but-different question and imply it addresses the query |
| TELLS: off-topic (non-legal) question | State it's out of scope, do not attempt to answer generally |
| TELLS: user asks for a legal opinion/recommendation | State that a qualified legal reviewer should be consulted; do not generate advice framed as a recommendation |
| Any component: model call fails / times out | User-facing generic failure notice (per NFR reliability) + audit log entry with failure status — never fail silently |

---

## 8. Sensitivity & RBAC Interaction (Legal-Specific)

Beyond the general RBAC enforcement in `SKILLS.md`, legal documents carry additional sensitivity considerations an implementation agent should keep in mind:

- **Contract value and counterparty identity are often the most sensitive fields** in a legal document — when TELLS answers cross-document questions (e.g., "berapa total nilai kontrak dengan vendor X"), the RBAC filter in retrieval (`SKILLS.md` §10) must apply per-document, not just at the conversation level, so a user with access to 3 of 5 matching contracts only sees aggregated/answered data from those 3.
- **Never aggregate or summarize across documents the user doesn't have access to**, even in an anonymized or rounded form — this is still a data leak (e.g., "total contracts with this vendor: 5" when the user can only see 3 is already information disclosure).

---

## 9. Evaluation & Accuracy Metrics

Before treating LER/TELLS as production-ready, validate against these minimums (adjust thresholds after establishing a labeled eval set from real Telkom legal documents):

**LER (per entity type, on a held-out labeled sample):**
- Precision/recall per field (`parties`, `dates`, `contract_number`, `organizations` at minimum)
- False-positive rate on `contract_value` and `dates` weighted higher than others — wrong money/date extractions are the costliest errors
- % of extractions where `extraction_confidence` correctly predicts human-reviewer correction rate (i.e., confidence calibration, not just accuracy)

**TELLS:**
- Citation accuracy: % of cited document IDs that were actually in the retrieved context (should be ~100% if §6 rule #1 is enforced correctly)
- Groundedness: % of answer claims traceable to retrieved text (manual eval on a sample set)
- Correct refusal rate: % of out-of-scope / no-context queries correctly refused instead of answered
- RBAC leak rate: **must be 0%** — any leak of inaccessible document content/metadata is a shipped-blocking bug, not a quality metric to improve over time

---

## 10. Escalation / Human-in-the-Loop Rules

- Any document where LER `extraction_confidence` is `low` on `contract_value`, `dates`, or `parties` **should** surface a "needs review" indicator on the document detail page — this is a MAY for MVP but a strong recommendation, not just cosmetic.
- Corrections made by a human reviewer to LER output **should** be stored (append, not overwrite) so they can later seed a fine-tuned NER model per the upgrade path in `SKILLS.md` §9 — don't discard reviewer corrections after applying them.
- TELLS refusing to answer is a correct, expected outcome for out-of-scope or low-confidence cases — **do not** treat refusal rate as a bug to "fix" by loosening grounding rules. Over-answering is worse than under-answering in this domain.

---

## 11. Glossary Additions (Legal-Specific, beyond `AGENT_CONTEXT.md` §8)

| Term | Meaning |
|---|---|
| **Pihak Pertama / Pihak Kedua** | "First Party / Second Party" — common role labels in Indonesian contracts, not literal party names |
| **Kop surat** | Letterhead — often where the authoritative contract number appears |
| **Force Majeure** | Standard clause excusing performance due to extraordinary events; presence/absence is a useful extracted flag |
| **Jangka Waktu** | Duration/term clause — frequently relative ("12 bulan sejak ditandatangani"), not an absolute date |
| **Kerahasiaan** | Confidentiality clause |
| **Penyelesaian Sengketa** | Dispute resolution clause (arbitration/court venue) |
| **BANI** | Badan Arbitrase Nasional Indonesia — common arbitration body referenced in `dispute_resolution` |
| **Addendum / Amandemen** | Amendment document; always relational to a parent contract |

---

## 12. Open Questions — Do Not Assume

Per `AGENT_CONTEXT.md` §7 convention, these are flagged rather than silently decided:

- Exact labeled dataset availability/timeline for eventually training the Option A (fine-tuned IndoBERT) NER model — unknown, treat Option B (LLM-prompted) as the only viable path until confirmed otherwise.
- Whether `contract_value` currency is always IDR or can include foreign-currency contracts — affects whether currency parsing needs multi-currency support from day one.
- Exact list of recognized `dispute_resolution` venues/bodies beyond BANI/Pengadilan Negeri — needs legal team input, do not hardcode an assumed exhaustive list.
- Whether TELLS should support comparative/aggregate queries across many documents at all (e.g., "total value of all vendor X contracts") — this has RBAC/aggregation implications per §8 and should be explicitly scoped in or out before implementation, not defaulted to "yes" because it seems useful.
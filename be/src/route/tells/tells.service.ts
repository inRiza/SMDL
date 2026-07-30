import { chatWithOllama } from "@/lib/llm/ollama.client";
import {
  buildCitationSources,
  resolveCitationsFromReply,
} from "@/lib/rag/citation.util";
import {
  DocumentCatalogService,
} from "@/lib/rag/document-catalog.service";
import { classifyQuery, isMetaQuery, isPureGreeting, wasGreetingIncluded } from "@/lib/rag/query.util";
import { GREETING_REPLY, buildMetaReply } from "@/lib/tells/capability-reply";
import { RetrievalService } from "@/lib/rag/retrieval.service";
import { TellsConversationService } from "./tells.conversation.service";
import type { TellsCitation, TellsChatResult } from "@/types/tells.types";
import type { TellsChatInput } from "@/validators/tells.validator";

const FALLBACK_REPLY = "Maaf, TELLS sedang tidak dapat menghubungi model lokal. Coba lagi nanti, atau pastikan Ollama berjalan di mesin ini.";

const NOT_FOUND_REPLY = "Saya belum menemukan informasi yang cocok di dokumen SMDL. Coba tanyakan dengan kata kunci lain, misalnya nama pihak, jenis dokumen, atau topik kontrak.";

export class TellsService {
  constructor(
    private readonly retrieval = new RetrievalService(),
    private readonly catalog = new DocumentCatalogService(),
    private readonly conversations = new TellsConversationService()
  ) {}

  async chat(input: TellsChatInput, userId: string): Promise<TellsChatResult> {
    const intent = classifyQuery(input.message);

    let result: Omit<TellsChatResult, "conversationId">;

    switch (intent) {
      case "greeting":
        result = this.replyWithGreeting(input);
        break;
      case "meta":
        result = this.replyWithCapability(input);
        break;
      case "document_latest":
        result = await this.replyWithLatestDocuments(input);
        break;
      case "document_list":
        result = await this.replyWithDocumentList(input);
        break;
      case "document_search":
        result = await this.replyWithMetadataSearch(input);
        break;
      default:
        result = await this.replyWithContentRag(input);
    }

    const conversationId = await this.conversations.appendExchange({
      userId,
      conversationId: input.conversationId,
      userMessage: input.message,
      assistantMessage: result.reply,
      citations: result.citations,
    });

    return { ...result, conversationId };
  }

  private async replyWithLatestDocuments(
    input: TellsChatInput
  ): Promise<TellsChatResult> {
    const docs = await this.catalog.getLatest(3);
    const citations = this.catalog.docsToCitations(docs);
    const reply = this.catalog.buildLatestReply(
      docs,
      wasGreetingIncluded(input.message)
    );

    return {
      reply: docs.length > 0 ? `${reply} [1]` : reply,
      source: "ollama",
      fallback: false,
      citations: docs.length > 0 ? citations.slice(0, 1) : [],
    };
  }

  private async replyWithDocumentList(
    input: TellsChatInput
  ): Promise<TellsChatResult> {
    const [docs, total] = await Promise.all([
      this.catalog.getLatest(5),
      this.catalog.countDocuments(),
    ]);

    return {
      reply: this.catalog.buildListReply(
        docs,
        total,
        wasGreetingIncluded(input.message)
      ),
      source: "ollama",
      fallback: false,
      citations: this.catalog.docsToCitations(docs.slice(0, 3)),
    };
  }

  private async replyWithMetadataSearch(
    input: TellsChatInput
  ): Promise<TellsChatResult> {
    const docs = await this.catalog.searchMetadata(input.message, 5);

    if (docs.length === 0) {
      return this.replyWithContentRag(input, { allowMetadataFallback: false });
    }

    const citations = this.catalog.docsToCitations(docs.slice(0, 3));
    const context = docs
      .map(
        (doc, index) =>
          `[${index + 1}] ${doc.title} (${doc.category ?? "Tanpa kategori"}, status: ${doc.status})\n${doc.description ?? "Tidak ada deskripsi."}`
      )
      .join("\n\n");

    try {
      const content = await chatWithOllama(
        [
          {
            role: "system",
            content: `You are TELLS, assistant dokumen legal Telkom. Jawab berdasarkan daftar dokumen di bawah. Gunakan marker [1], [2] jika menyebut dokumen spesifik. Jawab natural dalam Bahasa Indonesia. Boleh sapa user jika pertanyaan diawali sapaan.

Documents:
${context}`,
          },
          ...input.history.map((item) => ({
            role: item.role,
            content: item.content,
          })),
          { role: "user", content: input.message },
        ],
        { temperature: 0.3 }
      );

      return {
        reply: content.trim(),
        source: "ollama",
        fallback: false,
        citations: resolveCitationsFromReply(content, citations) as TellsCitation[],
      };
    } catch {
      return {
        reply: this.catalog.buildListReply(
          docs,
          docs.length,
          wasGreetingIncluded(input.message)
        ),
        source: "fallback",
        fallback: true,
        citations,
      };
    }
  }

  private async replyWithContentRag(
    input: TellsChatInput,
    options?: { allowMetadataFallback?: boolean }
  ): Promise<TellsChatResult> {
    const allowMetadataFallback = options?.allowMetadataFallback ?? true;

    let hits = await this.retrieval.search(input.message);

    if (hits.length === 0 && allowMetadataFallback) {
      const docs = await this.catalog.searchMetadata(input.message, 3);
      if (docs.length > 0) {
        return this.replyWithMetadataSearch(input);
      }

      if (isPureGreeting(input.message)) {
        return this.replyWithGreeting(input);
      }

      if (isMetaQuery(input.message)) {
        return this.replyWithCapability(input);
      }

      return {
        reply: NOT_FOUND_REPLY,
        source: "ollama",
        fallback: false,
        citations: [],
      };
    }

    if (hits.length === 0) {
      return {
        reply: NOT_FOUND_REPLY,
        source: "ollama",
        fallback: false,
        citations: [],
      };
    }

    const sources = buildCitationSources(hits);
    const context = sources
      .map(
        (source, index) =>
          `[${index + 1}] ${source.title} (id: ${source.documentId})\n${hits[index]?.content ?? source.snippet}`
      )
      .join("\n\n");

    try {
      const content = await chatWithOllama(
        [
          {
            role: "system",
            content: `You are TELLS, a legal document assistant for internal Telkom staff.

Rules:
- Answer using the retrieved excerpts below.
- When stating a fact from a document, add citation markers like [1] or [2].
- If excerpts do not fully answer the question, explain what is available and what is missing.
- Reply naturally in Bahasa Indonesia. You may respond to greetings in the same message.
- References will be shown automatically in the UI.

Retrieved excerpts:
${context}`,
          },
          ...input.history.map((item) => ({
            role: item.role,
            content: item.content,
          })),
          { role: "user", content: input.message },
        ],
        { temperature: 0.25 }
      );

      const citations = resolveCitationsFromReply(content, sources);

      return {
        reply: content.trim(),
        source: "ollama",
        fallback: false,
        citations: citations as TellsCitation[],
      };
    } catch {
      return {
        reply: FALLBACK_REPLY,
        source: "fallback",
        fallback: true,
        citations: [],
      };
    }
  }

  private replyWithGreeting(_input: TellsChatInput): TellsChatResult {
    return {
      reply: GREETING_REPLY,
      source: "ollama",
      fallback: false,
      citations: [],
    };
  }

  private replyWithCapability(input: TellsChatInput): TellsChatResult {
    const greetingPrefix = wasGreetingIncluded(input.message) ? "Halo! " : "";
    return {
      reply: greetingPrefix + buildMetaReply(input.message),
      source: "ollama",
      fallback: false,
      citations: [],
    };
  }
}

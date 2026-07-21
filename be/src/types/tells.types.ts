export type TellsCitation = {
    documentId: string;
    title: string;
    description: string | null;
    category: string | null;
    fileFormat: "pdf" | "docx";
    fileSizeBytes: string;
    status: string;
    score: number;
    snippet: string;
    refIndex: number;
};

export type TellsChatResult = {
    reply: string;
    source: "ollama" | "fallback";
    fallback: boolean;
    citations: TellsCitation[];
    conversationId: string;
};

export type TellsConversationSummary = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
};

export type TellsConversationDetail = TellsConversationSummary & {
    messages: Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        citations: TellsCitation[];
        createdAt: string;
    }>;
};
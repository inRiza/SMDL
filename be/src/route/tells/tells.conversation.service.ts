import { prismaClient } from "@/lib/db/prisma";
import { buildConversationTitle } from "@/lib/tells/conversation-title";
import type { TellsCitation } from "@/types/tells.types";

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: TellsCitation[];
  createdAt: Date;
};

export class TellsConversationService {
  async list(userId: string) {
    const rows = await prismaClient.tellsChat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            content: true,
            role: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      title:
        row.title ??
        row.messages.find((message) => message.role === "user")?.content ??
        "Percakapan baru",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async create(userId: string) {
    const row = await prismaClient.tellsChat.create({
      data: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: row.id,
      title: row.title ?? "Percakapan baru",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messages: [] as StoredMessage[],
    };
  }

  async getById(conversationId: string, userId: string) {
    const row = await prismaClient.tellsChat.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      title: row.title ?? "Percakapan baru",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messages: row.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        citations: (message.citations as TellsCitation[] | null) ?? [],
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  async appendExchange(input: {
    userId: string;
    conversationId?: string;
    userMessage: string;
    assistantMessage: string;
    citations?: TellsCitation[];
  }) {
    const { userId } = input;

    const conversation =
      input.conversationId != null
        ? await prismaClient.tellsChat.findFirst({
            where: { id: input.conversationId, userId },
          })
        : null;

    const chat =
      conversation ??
      (await prismaClient.tellsChat.create({
        data: {
          userId,
          title: buildConversationTitle(input.userMessage),
        },
      }));

    await prismaClient.$transaction([
      prismaClient.tellsChatMessage.create({
        data: {
          tellsChatId: chat.id,
          role: "user",
          content: input.userMessage,
        },
      }),
      prismaClient.tellsChatMessage.create({
        data: {
          tellsChatId: chat.id,
          role: "assistant",
          content: input.assistantMessage,
          citations: input.citations ?? [],
        },
      }),
      prismaClient.tellsChat.update({
        where: { id: chat.id },
        data: {
          title: chat.title ?? buildConversationTitle(input.userMessage),
          updatedAt: new Date(),
        },
      }),
    ]);

    return chat.id;
  }

  async delete(conversationId: string, userId: string) {
    const result = await prismaClient.tellsChat.deleteMany({
      where: { id: conversationId, userId },
    });

    return result.count > 0;
  }
}

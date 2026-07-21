import type { Context } from "hono";
import { getRequestUserId, unauthorizedResponse } from "@/lib/auth/request-user";
import { TellsService } from "./tells.service";
import { TellsConversationService } from "./tells.conversation.service";
import { tellsChatSchema } from "@/validators/tells.validator";

export class TellsController {
  constructor(
    private readonly service = new TellsService(),
    private readonly conversations = new TellsConversationService()
  ) {}

  chat = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json(unauthorizedResponse(), 401);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = tellsChatSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        400
      );
    }

    const result = await this.service.chat(parsed.data, userId);
    return c.json(result);
  };

  listConversations = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json(unauthorizedResponse(), 401);
    }

    const data = await this.conversations.list(userId);
    return c.json({ data });
  };

  createConversation = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json(unauthorizedResponse(), 401);
    }

    const data = await this.conversations.create(userId);
    return c.json(data, 201);
  };

  getConversation = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json(unauthorizedResponse(), 401);
    }

    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Conversation id is required" }, 400);
    }

    const data = await this.conversations.getById(id, userId);

    if (!data) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json(data);
  };

  deleteConversation = async (c: Context) => {
    const userId = getRequestUserId(c);
    if (!userId) {
      return c.json(unauthorizedResponse(), 401);
    }

    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Conversation id is required" }, 400);
    }

    const deleted = await this.conversations.delete(id, userId);

    if (!deleted) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    return c.json({ ok: true });
  };
};

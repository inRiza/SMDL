function buildConversationTitle(message: string) {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}

export { buildConversationTitle };

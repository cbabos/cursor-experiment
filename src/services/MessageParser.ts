interface ToolCall {
  name: string;
  args: Record<string, string>;
}

export class MessageParser {
  static parseToolCalls(content: string): ToolCall[] {
    // Simple pattern matching for tool calls
    // Format: /tool:name{arg1: value1, arg2: value2}
    const toolPattern = /\/tool:(\w+)\{([^}]+)\}/g;
    const tools: ToolCall[] = [];
    
    let match;
    while ((match = toolPattern.exec(content)) !== null) {
      const [, name, argsString] = match;
      try {
        // Convert "key: value" string to proper object
        const args = Object.fromEntries(
          argsString.split(',').map(pair => {
            const [key, value] = pair.split(':').map(s => s.trim());
            return [key, value];
          })
        );
        tools.push({ name, args });
      } catch (err: unknown) {
        console.error(`Failed to parse tool arguments: ${argsString}`, err);
      }
    }
    
    return tools;
  }
} 
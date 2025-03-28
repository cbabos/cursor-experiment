interface ToolCall {
  name: string;
  args: Record<string, string>;
}

export class MessageParser {
  static parseToolCalls(content: string): ToolCall[] {
    // Simple pattern matching for tool calls
    // Format: /tool:name{arg1: value1, arg2: value2}
    const toolPattern = /\/tool:(\w+)\{([^}]*)\}/g;
    const tools: ToolCall[] = [];
    
    let match;
    while ((match = toolPattern.exec(content)) !== null) {
      const [, name, argsString] = match;
      try {
        // Skip empty arguments
        if (!argsString.trim()) continue;

        // Split by commas, but only if not within a value
        const argPairs = argsString.split(/,(?=\s*[\w]+\s*:)/);
        const args: Record<string, string> = {};
        
        for (const pair of argPairs) {
          const [key, ...valueParts] = pair.split(':').map(s => s.trim());
          if (!key || valueParts.length === 0) continue;
          args[key] = valueParts.join(':'); // Rejoin value parts in case they contained colons
        }

        // Only add the tool call if we have valid arguments
        if (Object.keys(args).length > 0) {
          tools.push({ name, args });
        }
      } catch (err) {
        console.error(`Failed to parse tool arguments: ${argsString}`, err);
        // Skip invalid tool calls
        continue;
      }
    }
    
    return tools;
  }
} 
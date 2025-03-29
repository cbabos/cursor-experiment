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
        const args: Record<string, string> = {};
        
        // If argsString is not empty, parse the arguments
        if (argsString.trim()) {
          // Split by commas, but only if not within a value
          const argPairs = argsString.split(/,(?=\s*[\w]+\s*:)/);
          
          for (const pair of argPairs) {
            const [key, ...valueParts] = pair.split(':').map(s => s.trim());
            if (!key || valueParts.length === 0) continue;
            args[key] = valueParts.join(':'); // Rejoin value parts in case they contained colons
          }
        }

        // Add the tool call regardless of whether it has arguments
        tools.push({ name, args });
      } catch (err) {
        console.error(`Failed to parse tool arguments: ${argsString}`, err);
        // Skip invalid tool calls
        continue;
      }
    }
    
    return tools;
  }
} 
import { Tool } from '../types';

export class ToolService {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(args);
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
} 
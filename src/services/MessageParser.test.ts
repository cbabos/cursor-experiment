import { describe, it, expect } from 'vitest';
import { MessageParser } from './MessageParser';

describe('MessageParser', () => {
  it('should parse a single tool call correctly', () => {
    const content = 'Check the /tool:weather{location: London} today';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'weather',
      args: { location: 'London' },
    });
  });

  it('should parse multiple tool calls correctly', () => {
    const content = '/tool:weather{location: London} and /tool:calculator{expression: 2 + 2}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'weather',
      args: { location: 'London' },
    });
    expect(result[1]).toEqual({
      name: 'calculator',
      args: { expression: '2 + 2' },
    });
  });

  it('should return empty array for no tool calls', () => {
    const content = 'Just a regular message';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(0);
  });

  it('should handle invalid tool call format gracefully', () => {
    const content = '/tool:weather{location}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(0);
  });

  it('should handle tool calls with multiple arguments', () => {
    const content = '/tool:search{query: weather in London, limit: 5}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'search',
      args: {
        query: 'weather in London',
        limit: '5',
      },
    });
  });

  it('should handle tool calls with values containing colons', () => {
    const content = '/tool:search{url: https://example.com}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'search',
      args: {
        url: 'https://example.com',
      },
    });
  });

  it('should handle tool calls with values containing commas', () => {
    const content = '/tool:search{query: weather in London, Paris, and Berlin}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'search',
      args: {
        query: 'weather in London, Paris, and Berlin',
      },
    });
  });

  it('should handle tool calls with empty arguments', () => {
    const content = '/tool:weather{}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(0);
  });

  it('should handle tool calls with whitespace in arguments', () => {
    const content = '/tool:weather{  location  :  London  }';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'weather',
      args: {
        location: 'London',
      },
    });
  });

  it('should handle multiple tool calls with mixed valid and invalid formats', () => {
    const content = '/tool:weather{location: London} /tool:invalid{} /tool:calculator{expression: 1 + 1}';
    const result = MessageParser.parseToolCalls(content);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'weather',
      args: {
        location: 'London',
      },
    });
    expect(result[1]).toEqual({
      name: 'calculator',
      args: {
        expression: '1 + 1',
      },
    });
  });
}); 
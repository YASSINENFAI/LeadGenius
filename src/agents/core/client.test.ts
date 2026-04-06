import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables before module import
vi.stubEnv('GLM_API_KEY', 'test-api-key-123');
vi.stubEnv('GLM_BASE_URL', 'https://mock-api.local');
vi.stubEnv('GLM_MODEL', 'mock-model-v1');

// Mock timers for retry delay control
vi.useFakeTimers({ shouldAdvanceTime: true });

// Mock prisma so the registry falls back to env vars
vi.mock('../../lib/db/client.js', () => ({
  prisma: {
    aIProvider: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { chat, simpleChat } from './client.js';

// Helper to create a mock successful Anthropic response
function mockAnthropicResponse(content: any[] = [{ type: 'text', text: 'Hello' }]) {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: content,
    model: 'mock-model-v1',
    stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 20 },
  };
}

describe('client.ts (via registry)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('chat', () => {
    it('should make a successful POST request and return the JSON response', async () => {
      const mockResponse = mockAnthropicResponse();
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await chat({
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = (globalThis.fetch as any).mock.calls[0];
      expect(url).toContain('/v1/messages');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
    });

    it('should include system prompt and tools in the body if provided', async () => {
      const mockResponse = mockAnthropicResponse();
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const tools = [{ name: 'tool1', description: 'Test', input_schema: {} }];
      await chat({
        system: 'You are a bot.',
        messages: [{ role: 'user', content: 'Hi' }],
        tools: tools,
        maxTokens: 1024,
      });

      const fetchCall = (globalThis.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.system).toBe('You are a bot.');
      expect(body.tools).toEqual(tools);
      expect(body.max_tokens).toBe(1024);
    });

    it('should NOT include tools in the body if an empty array is provided', async () => {
      const mockResponse = mockAnthropicResponse();
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await chat({
        messages: [{ role: 'user', content: 'Hi' }],
        tools: [],
      });

      const fetchCall = (globalThis.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body).not.toHaveProperty('tools');
    });

    it('should handle API non-retryable errors (e.g. 400) immediately', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });

      await expect(chat({ messages: [] })).rejects.toThrow('AI API error (400): Bad Request');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable API errors (500) up to MAX_RETRIES', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const chatPromise = chat({ messages: [] });
      chatPromise.catch(() => {});

      await vi.runAllTimersAsync();

      await expect(chatPromise).rejects.toThrow('AI API error (500): Internal Server Error');

      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    it('should succeed on the second attempt after a retryable API error (429)', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = mockAnthropicResponse();

      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate Limited'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        });

      const chatPromise = chat({ messages: [] });
      await vi.runAllTimersAsync();
      const result = await chatPromise;

      expect(result).toEqual(mockResponse);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry specific network errors and eventually succeed', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockResponse = mockAnthropicResponse();
      const networkError = new Error('fetch ECONNREFUSED');

      (globalThis.fetch as any)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        });

      const chatPromise = chat({ messages: [] });
      await vi.runAllTimersAsync();

      const result = await chatPromise;
      expect(result).toEqual(mockResponse);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });

    it('should throw immediately on non-network errors', async () => {
      const nonNetworkError = new Error('Some weird logic error');
      (globalThis.fetch as any).mockRejectedValueOnce(nonNetworkError);

      await expect(chat({ messages: [] })).rejects.toThrow('Some weird logic error');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw network errors if they persist past MAX_RETRIES', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const networkError = new Error('fetch timeout');

      (globalThis.fetch as any).mockRejectedValue(networkError);

      const chatPromise = chat({ messages: [] });
      chatPromise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(chatPromise).rejects.toThrow('fetch timeout');
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('simpleChat', () => {
    it('should return the text from a successful chat response', async () => {
      const mockResponse = mockAnthropicResponse([
        { type: 'text', text: 'The answer is 42.' },
      ]);

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const text = await simpleChat('What is the answer?');
      expect(text).toBe('The answer is 42.');

      const fetchCall = (globalThis.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.messages).toEqual([{ role: 'user', content: 'What is the answer?' }]);
    });

    it('should pass system prompt and maxTokens options to chat', async () => {
      const mockResponse = mockAnthropicResponse([{ type: 'text', text: 'System processed.' }]);
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await simpleChat('prompt', { system: 'Be concise', maxTokens: 100 });

      const fetchCall = (globalThis.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toBe('Be concise');
      expect(body.max_tokens).toBe(100);
    });

    it('should throw an error if the response content contains no text blocks', async () => {
      const mockResponse = mockAnthropicResponse([]);
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(simpleChat('Hi')).rejects.toThrow('Unexpected empty response from AI');
    });

    it('should throw an error if the response content only contains tool use blocks', async () => {
      const mockResponse = mockAnthropicResponse([
        { type: 'tool_use', id: 'tool_1', name: 'calculator', input: {} },
      ]);

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(simpleChat('Calculate 2+2')).rejects.toThrow('Unexpected empty response from AI');
    });

    it('should propagate API errors correctly', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      const simpleChatPromise = simpleChat('Trigger error');
      simpleChatPromise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(simpleChatPromise).rejects.toThrow('AI API error (500): Server Error');
    });
  });
});

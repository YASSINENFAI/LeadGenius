import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma so registry falls back to env vars
vi.mock('../../lib/db/client.js', () => ({
  prisma: {
    aIProvider: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock the AI client
vi.mock('../../agents/core/client.js', () => ({
  simpleChat: vi.fn(),
}));

import { detectOpportunities } from './automation.js';
import { simpleChat } from '../../agents/core/client.js';
import type { Finding, DetectedTechnology } from './types.js';

const mockSimpleChat = vi.mocked(simpleChat);

describe('detectOpportunities', () => {
  const sampleFindings: Finding[] = [
    {
      title: 'Large image files detected',
      category: 'performance',
      severity: 'critical',
      value: '2.5 MB',
    },
    {
      title: 'Missing meta description',
      category: 'seo',
      severity: 'high',
      value: null,
    },
    {
      title: 'Low color contrast',
      category: 'accessibility',
      severity: 'medium',
      value: '#888 on #fff',
    },
  ];

  const sampleTechnologies: DetectedTechnology[] = [
    { name: 'WordPress', category: 'CMS' },
    { name: 'jQuery', category: 'JavaScript Library' },
  ];

  const validAIResponse = JSON.stringify([
    {
      title: 'Optimize image delivery',
      description: 'Large images slow down page load and hurt conversions.',
      impact: 'high',
      effort: 'low',
      category: 'performance',
    },
    {
      title: 'Add meta descriptions',
      description: 'Missing meta descriptions reduce click-through from search results.',
      impact: 'medium',
      effort: 'low',
      category: 'seo',
    },
  ]);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when no findings and no technologies are provided', async () => {
    const result = await detectOpportunities([], [], 'https://example.com');
    expect(result).toEqual([]);
    expect(mockSimpleChat).not.toHaveBeenCalled();
  });

  it('calls simpleChat with correct parameters', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    await detectOpportunities(sampleFindings, sampleTechnologies, 'https://example.com');

    expect(mockSimpleChat).toHaveBeenCalledTimes(1);
    const [prompt, options] = mockSimpleChat.mock.calls[0];
    expect(prompt).toContain('https://example.com');
    expect(options?.system).toContain('web consultant');
    expect(options?.maxTokens).toBe(2048);
  });

  it('parses AI response as array and returns mapped opportunities', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    const result = await detectOpportunities(sampleFindings, sampleTechnologies, 'https://example.com');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: 'Optimize image delivery',
      description: 'Large images slow down page load and hurt conversions.',
      impact: 'high',
      effort: 'low',
      category: 'performance',
    });
    expect(result[1]).toEqual({
      title: 'Add meta descriptions',
      description: 'Missing meta descriptions reduce click-through from search results.',
      impact: 'medium',
      effort: 'low',
      category: 'seo',
    });
  });

  it('parses AI response when wrapped in object with opportunities key', async () => {
    mockSimpleChat.mockResolvedValueOnce(JSON.stringify({
      opportunities: [
        {
          title: 'Add analytics',
          description: 'No tracking detected.',
          impact: 'high',
          effort: 'low',
          category: 'technology',
        },
      ],
    }));

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Add analytics');
  });

  it('returns empty array when AI response content is empty text', async () => {
    mockSimpleChat.mockResolvedValueOnce('');

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result).toEqual([]);
  });

  it('returns fallback opportunities when simpleChat throws an error', async () => {
    mockSimpleChat.mockRejectedValueOnce(new Error('API error'));

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result.length).toBeGreaterThan(0);
  });

  it('returns fallback opportunities when AI response is invalid JSON', async () => {
    mockSimpleChat.mockResolvedValueOnce('not valid json {{{');

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toContain('critical');
    expect(result[0].impact).toBe('high');
  });

  it('generates correct fallback from critical findings grouped by category', async () => {
    mockSimpleChat.mockRejectedValueOnce(new Error('fail'));

    const findings: Finding[] = [
      { title: 'Issue 1', category: 'performance', severity: 'critical', value: null },
      { title: 'Issue 2', category: 'performance', severity: 'critical', value: null },
      { title: 'Issue 3', category: 'seo', severity: 'critical', value: null },
      { title: 'Issue 4', category: 'accessibility', severity: 'warning', value: null },
    ];

    const result = await detectOpportunities(findings, [], 'https://example.com');

    expect(result).toHaveLength(2);
    const perfOpp = result.find((r) => r.category === 'performance');
    expect(perfOpp).toBeDefined();
    expect(perfOpp!.title).toBe('Fix 2 critical performance issues');
    expect(perfOpp!.impact).toBe('high');
    expect(perfOpp!.effort).toBe('medium');
  });

  it('limits fallback opportunities to 5', async () => {
    mockSimpleChat.mockRejectedValueOnce(new Error('fail'));

    const findings: Finding[] = Array.from({ length: 8 }, (_, i) => ({
      title: `Issue ${i}`,
      category: `category-${i}`,
      severity: 'critical' as const,
      value: null,
    }));

    const result = await detectOpportunities(findings, [], 'https://example.com');

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('returns empty fallback when no critical findings exist', async () => {
    mockSimpleChat.mockRejectedValueOnce(new Error('fail'));

    const findings: Finding[] = [
      { title: 'Minor issue', category: 'seo', severity: 'info', value: null },
      { title: 'Another minor', category: 'performance', severity: 'warning', value: null },
    ];

    const result = await detectOpportunities(findings, [], 'https://example.com');

    expect(result).toEqual([]);
  });

  it('includes URL in the prompt', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    await detectOpportunities(sampleFindings, [], 'https://my-dutch-site.nl');

    const [prompt] = mockSimpleChat.mock.calls[0];
    expect(prompt).toContain('https://my-dutch-site.nl');
  });

  it('includes technologies in the prompt when provided', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    await detectOpportunities([], sampleTechnologies, 'https://example.com');

    const [prompt] = mockSimpleChat.mock.calls[0];
    expect(prompt).toContain('WordPress');
    expect(prompt).toContain('jQuery');
    expect(prompt).toContain('CMS');
    expect(prompt).toContain('JavaScript Library');
  });

  it('includes findings in the prompt with severity and value', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    await detectOpportunities(sampleFindings, [], 'https://example.com');

    const [prompt] = mockSimpleChat.mock.calls[0];
    expect(prompt).toContain('CRITICAL');
    expect(prompt).toContain('performance');
    expect(prompt).toContain('Large image files detected');
    expect(prompt).toContain('2.5 MB');
  });

  it('limits findings to 20 in the prompt', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    const manyFindings: Finding[] = Array.from({ length: 30 }, (_, i) => ({
      title: `Finding ${i}`,
      category: 'performance',
      severity: 'warning' as const,
      value: null,
    }));

    await detectOpportunities(manyFindings, [], 'https://example.com');

    const [prompt] = mockSimpleChat.mock.calls[0];
    expect(prompt).toContain('Finding 0');
    expect(prompt).toContain('Finding 19');
    expect(prompt).not.toContain('Finding 20');
  });

  it('works with only technologies and no findings', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    const result = await detectOpportunities([], sampleTechnologies, 'https://example.com');

    expect(result).toHaveLength(2);
    expect(mockSimpleChat).toHaveBeenCalledTimes(1);
  });

  it('works with only findings and no technologies', async () => {
    mockSimpleChat.mockResolvedValueOnce(validAIResponse);

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result).toHaveLength(2);
  });

  it('handles AI response with empty array', async () => {
    mockSimpleChat.mockResolvedValueOnce('[]');

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result).toEqual([]);
  });

  it('handles AI response with object containing empty opportunities array', async () => {
    mockSimpleChat.mockResolvedValueOnce('{"opportunities": []}');

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result).toEqual([]);
  });

  it('maps all fields from AI opportunity to output opportunity', async () => {
    mockSimpleChat.mockResolvedValueOnce(JSON.stringify([
      {
        title: 'Install booking system',
        description: 'No online booking available for customers.',
        impact: 'high',
        effort: 'medium',
        category: 'conversion',
      },
    ]));

    const result = await detectOpportunities(
      [{ title: 't', category: 'c', severity: 'low', value: null }],
      [],
      'https://example.com',
    );

    expect(result).toHaveLength(1);
    const opp = result[0];
    expect(opp).toHaveProperty('title', 'Install booking system');
    expect(opp).toHaveProperty('description', 'No online booking available for customers.');
    expect(opp).toHaveProperty('impact', 'high');
    expect(opp).toHaveProperty('effort', 'medium');
    expect(opp).toHaveProperty('category', 'conversion');
  });

  it('handles multiple opportunities with different impact/effort levels', async () => {
    mockSimpleChat.mockResolvedValueOnce(JSON.stringify([
      { title: 'A', description: 'd', impact: 'high', effort: 'low', category: 'performance' },
      { title: 'B', description: 'd', impact: 'medium', effort: 'medium', category: 'seo' },
      { title: 'C', description: 'd', impact: 'low', effort: 'high', category: 'accessibility' },
      { title: 'D', description: 'd', impact: 'high', effort: 'high', category: 'technology' },
    ]));

    const result = await detectOpportunities(sampleFindings, sampleTechnologies, 'https://example.com');

    expect(result).toHaveLength(4);
    expect(result.map((r) => r.impact)).toEqual(['high', 'medium', 'low', 'high']);
    expect(result.map((r) => r.effort)).toEqual(['low', 'medium', 'high', 'high']);
  });

  it('handles AI response with extra properties on opportunity objects', async () => {
    mockSimpleChat.mockResolvedValueOnce(JSON.stringify([
      {
        title: 'Fix perf',
        description: 'desc',
        impact: 'high',
        effort: 'low',
        category: 'performance',
        extraField: 'ignored',
        anotherExtra: 42,
      },
    ]));

    const result = await detectOpportunities(sampleFindings, [], 'https://example.com');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: 'Fix perf',
      description: 'desc',
      impact: 'high',
      effort: 'low',
      category: 'performance',
    });
    expect(result[0]).not.toHaveProperty('extraField');
  });
});

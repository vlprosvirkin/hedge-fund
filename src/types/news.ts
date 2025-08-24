import { z } from 'zod';

// ===== News API Types =====

export const DigestItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  significance: z.string(),
  implications: z.string(),
  assets: z.array(z.string()),
  source: z.string(),
  url: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const DigestResponseSchema = z.object({
  items: z.array(DigestItemSchema),
  count: z.number(),
  timestamp: z.date(),
});

export const NewsSupportedTokensResponseSchema = z.object({
  primary_assets: z.array(z.object({
    text: z.string(),
    callback_data: z.string(),
  })),
  additional_assets: z.array(z.object({
    text: z.string(),
    callback_data: z.string(),
  })),
  total_count: z.number(),
  primary_count: z.number(),
  additional_count: z.number(),
  timestamp: z.string(),
});

export const NewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.number(),
  sentiment: z.number(),
  description: z.string().optional().or(z.undefined()),
  assets: z.array(z.string()).optional().or(z.undefined()),
});

// ===== Type Exports =====

export type DigestItem = z.infer<typeof DigestItemSchema>;
export type DigestResponse = z.infer<typeof DigestResponseSchema>;
export type NewsSupportedTokensResponse = z.infer<typeof NewsSupportedTokensResponseSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;

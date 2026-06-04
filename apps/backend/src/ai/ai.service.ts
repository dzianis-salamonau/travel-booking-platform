import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  isEnabled(): boolean {
    return this.config.get('AI_ENABLED') === 'true' && !!this.openai;
  }

  async parseQuery(query: string) {
    if (!this.isEnabled()) {
      return this.parseQueryFallback(query);
    }

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract travel search filters from user query. Return JSON only with keys: destinationSlug (kebab-case), departureDateFrom (YYYY-MM-DD), departureDateTo, priceMax (number), durationMin, hotelRatingMin, summary (brief). Use null for unknown fields.`,
        },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(content);
    } catch {
      return this.parseQueryFallback(query);
    }
  }

  private parseQueryFallback(query: string) {
    const lower = query.toLowerCase();
    const filters: Record<string, unknown> = { summary: 'Parsed with basic rules (AI disabled)' };

    if (lower.includes('spain') || lower.includes('tenerife')) filters.destinationSlug = 'tenerife';
    if (lower.includes('portugal') || lower.includes('algarve')) filters.destinationSlug = 'algarve';
    if (lower.includes('cape verde') || lower.includes('sal')) filters.destinationSlug = 'sal';

    const priceMatch = query.match(/€?\s*(\d+)/);
    if (priceMatch) filters.priceMax = parseInt(priceMatch[1], 10);

    const monthMatch = lower.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/);
    if (monthMatch) {
      const months: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      };
      const m = months[monthMatch[1]];
      filters.departureDateFrom = `2026-${String(m + 1).padStart(2, '0')}-01`;
      filters.departureDateTo = `2026-${String(m + 1).padStart(2, '0')}-28`;
    }

    if (lower.includes('beach')) filters.summary = 'Beach holiday preferences detected';
    return filters;
  }

  async getDestinationSummary(slug: string) {
    const cached = await this.prisma.aiSummaryCache.findUnique({ where: { slug } });
    if (cached && cached.expiresAt > new Date()) {
      return cached.content;
    }

    const destination = await this.prisma.destination.findFirst({
      where: { slug },
    });

    if (!this.isEnabled()) {
      return {
        slug,
        overview: destination?.description ?? `${slug} is a wonderful travel destination.`,
        weather: 'Warm and pleasant during summer months.',
        attractions: ['Local beaches', 'Historic sites', 'Markets'],
        tips: ['Book early for best prices', 'Check local transport options'],
      };
    }

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a travel destination summary as JSON with keys: overview, weather, attractions (array), tips (array).',
        },
        {
          role: 'user',
          content: `Destination: ${destination?.name ?? slug}, Country: ${destination?.country ?? 'Unknown'}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
    const summary = { slug, ...content };

    await this.prisma.aiSummaryCache.upsert({
      where: { slug },
      create: {
        slug,
        content: summary,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
      update: {
        content: summary,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    return summary;
  }
}

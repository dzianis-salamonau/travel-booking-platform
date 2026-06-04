import { Injectable } from '@nestjs/common';
import {
  createMockProviders,
  getProviderBySlug,
  ITravelProvider,
} from '@travel/provider-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProviderRegistryService {
  private readonly adapters: ITravelProvider[] = createMockProviders();

  constructor(private readonly prisma: PrismaService) {}

  getAdapters(): ITravelProvider[] {
    return this.adapters;
  }

  getAdapterBySlug(slug: string): ITravelProvider | undefined {
    return getProviderBySlug(slug, this.adapters);
  }

  async getAdapterForProviderId(providerId: string): Promise<ITravelProvider | undefined> {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) return undefined;
    return this.getAdapterBySlug(provider.slug);
  }
}

export * from './types';
export * from './utils';
export { MockProviderA } from './mock-provider-a';
export { MockProviderB } from './mock-provider-b';
export type { ITravelProvider } from './types';

import { MockProviderA } from './mock-provider-a';
import { MockProviderB } from './mock-provider-b';
import { ITravelProvider } from './types';

export function createMockProviders(): ITravelProvider[] {
  return [new MockProviderA(), new MockProviderB()];
}

export function getProviderBySlug(
  slug: string,
  providers: ITravelProvider[],
): ITravelProvider | undefined {
  return providers.find((p) => p.providerSlug === slug);
}

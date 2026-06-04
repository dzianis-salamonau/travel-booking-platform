import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const prisma = {
    commissionRule: { findFirst: jest.fn().mockResolvedValue({ percentage: 15 }) },
    depositRule: { findFirst: jest.fn().mockResolvedValue({ percentage: 20 }) },
  } as unknown as ConstructorParameters<typeof PricingService>[0];

  const service = new PricingService(prisma);

  it('applies 15% commission to base price', () => {
    expect(service.applyCommission(1000, 15)).toBe(1150);
  });

  it('calculates 20% deposit', () => {
    expect(service.calculateDeposit(1150, 20)).toBe(230);
  });
});

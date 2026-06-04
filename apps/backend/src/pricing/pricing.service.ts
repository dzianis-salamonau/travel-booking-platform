import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultCommissionPercentage(): Promise<number> {
    const rule = await this.prisma.commissionRule.findFirst({
      where: { isActive: true, isDefault: true },
    });
    return rule ? Number(rule.percentage) : 15;
  }

  async getDefaultDepositPercentage(): Promise<number> {
    const rule = await this.prisma.depositRule.findFirst({
      where: { isActive: true, isDefault: true },
    });
    return rule ? Number(rule.percentage) : 20;
  }

  applyCommission(basePrice: number, commissionPercentage: number): number {
    return Math.round(basePrice * (1 + commissionPercentage / 100) * 100) / 100;
  }

  calculateDeposit(displayedPrice: number, depositPercentage: number): number {
    return Math.round(displayedPrice * (depositPercentage / 100) * 100) / 100;
  }

  async getDisplayedPrice(basePrice: number): Promise<number> {
    const commission = await this.getDefaultCommissionPercentage();
    return this.applyCommission(basePrice, commission);
  }

  async getDepositAmount(displayedPrice: number): Promise<{ depositAmount: number; depositPercentage: number }> {
    const depositPercentage = await this.getDefaultDepositPercentage();
    return {
      depositAmount: this.calculateDeposit(displayedPrice, depositPercentage),
      depositPercentage,
    };
  }
}

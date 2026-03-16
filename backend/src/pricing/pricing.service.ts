import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule, PricingRuleType } from '../entities/pricing-rule.entity';
import { Product } from '../entities/product.entity';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingRule)
    private pricingRepository: Repository<PricingRule>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll() {
    return this.pricingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findActive() {
    return this.pricingRepository.find({ where: { isActive: true } });
  }

  async create(data: Partial<PricingRule>) {
    const rule = this.pricingRepository.create(data);
    return this.pricingRepository.save(rule);
  }

  async update(id: number, data: Partial<PricingRule>) {
    await this.pricingRepository.update(id, data);
    return this.pricingRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.pricingRepository.delete(id);
    return { deleted: true };
  }

  async calculatePricing(productId: number, basePrice: number, quantity: number, clientEmail?: string) {
    const activeRules = await this.findActive();
    
    // Filter rules for this product, global rules, and optionally for specific client
    const rules = activeRules.filter(r => {
      const matchProduct = !r.productId || r.productId === productId;
      const matchClient = !r.clientEmail || r.clientEmail === clientEmail;
      return matchProduct && matchClient;
    });

    let markup = 0;
    let discount = 0;

    // Client-specific rules take precedence
    const clientRule = rules.find(r => r.clientEmail === clientEmail);
    const appliedRuleObj = clientRule || null;

    // 1. Identify Markups
    const qtyRules = rules
      .filter(r => r.type === PricingRuleType.QTY_DISCOUNT)
      .sort((a, b) => b.threshold - a.threshold);

    const appliedQtyRule = qtyRules.find(r => quantity >= r.threshold);
    
    if (clientRule) {
      if (clientRule.type === PricingRuleType.MARKUP || clientRule.type === PricingRuleType.QTY_DISCOUNT) {
        markup = clientRule.value;
      } else if (clientRule.type === PricingRuleType.DISCOUNT || clientRule.type === PricingRuleType.PROMOTION) {
        discount = clientRule.value;
      }
    } else if (appliedQtyRule) {
      markup = appliedQtyRule.value;
    } else {
      const standardMarkup = rules.find(r => r.type === PricingRuleType.MARKUP && !r.clientEmail);
      if (standardMarkup) markup = standardMarkup.value;
    }

    // 2. Identify Discounts
    const promotion = rules.find(r => r.type === PricingRuleType.PROMOTION && !r.clientEmail);
    if (promotion && !clientRule) discount += promotion.value;

    const landedPrice = basePrice * (1 + markup - discount) * 1.07;

    return {
      markup,
      discount,
      landedPrice,
      appliedRule: appliedQtyRule ? appliedQtyRule.name : (clientRule ? `CLIENT: ${clientRule.name}` : 'Standard')
    };
  }

  async getEstimate(productId: number, quantity: number, clientEmail?: string) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new BadRequestException('Product not found');
    return this.calculatePricing(productId, product.basePrice, quantity, clientEmail);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productsRepository.create(data);
    return this.productsRepository.save(product);
  }

  async findAll(includeInactive = false): Promise<Product[]> {
    if (includeInactive) {
      return this.productsRepository.find({ relations: ['inventories'] });
    }
    return this.productsRepository.find({ where: { isActive: true }, relations: ['inventories'] });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['inventories'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { sku, isActive: true },
      relations: ['inventories'],
    });
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async toggleStatus(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.isActive = !product.isActive;
    return this.productsRepository.save(product);
  }

  async updateReorderPoint(id: number, point: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.reorderPoint = point;
    return this.productsRepository.save(product);
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, data);
    return this.productsRepository.save(product);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { success: true };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentGateway } from './shipment.gateway';

describe('ShipmentGateway', () => {
  let gateway: ShipmentGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShipmentGateway],
    }).compile();

    gateway = module.get<ShipmentGateway>(ShipmentGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

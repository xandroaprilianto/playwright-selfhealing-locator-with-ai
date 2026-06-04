import { faker } from '@faker-js/faker';
import { OrderData } from '../../types/test-data.types';

export class OrderBuilder {
  private data: OrderData;

  constructor() {
    this.data = {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      items: ['item_1', 'item_2'],
      total: 100000,
    };
  }

  withTotal(total: number): this {
    this.data.total = total;
    return this;
  }

  build(): Readonly<OrderData> {
    return { ...this.data };
  }
}

export const anOrder = () => new OrderBuilder();

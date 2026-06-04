import { faker } from '@faker-js/faker';
import { PaymentData } from '../../types/test-data.types';

export class PaymentBuilder {
  private data: PaymentData;

  constructor() {
    this.data = {
      cardNumber: faker.finance.creditCardNumber('visa'),
      expiry: '12/25',
      cvv: faker.finance.creditCardCVV(),
    };
  }

  asExpiredCard(): this {
    this.data.expiry = '01/20';
    return this;
  }

  build(): Readonly<PaymentData> {
    return { ...this.data };
  }
}

export const aPayment = () => new PaymentBuilder();

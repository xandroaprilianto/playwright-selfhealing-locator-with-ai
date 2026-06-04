import { faker } from '@faker-js/faker';
import { AddressData } from '../../types/test-data.types';

export class AddressBuilder {
  private data: AddressData;

  constructor() {
    this.data = {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zip: faker.location.zipCode(),
    };
  }

  withCity(city: string): this {
    this.data.city = city;
    return this;
  }

  build(): Readonly<AddressData> {
    return { ...this.data };
  }
}

export const anAddress = () => new AddressBuilder();

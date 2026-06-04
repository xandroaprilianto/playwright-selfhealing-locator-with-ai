import { faker } from '@faker-js/faker';
import { UserData } from '../../types/test-data.types';

export class UserBuilder {
  private data: UserData;

  constructor() {
    this.data = {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'Password123!',
    };
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  asInvalidEmail(): this {
    this.data.email = 'invalid-email-format';
    return this;
  }

  build(): Readonly<UserData> {
    return { ...this.data };
  }
}

export const aUser = () => new UserBuilder();

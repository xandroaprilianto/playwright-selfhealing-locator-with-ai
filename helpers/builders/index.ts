import { faker } from '@faker-js/faker';

export * from './user.builder';
export * from './address.builder';
export * from './payment.builder';
export * from './order.builder';

export const AuthBuilder = {
  // Hardcoded test data based on test_cases.md
  validAdmin: () => ({
    email: 'admin@example.com',
    password: 'password123',
  }),
  validNewUser: () => ({
    email: 'newuser@example.com',
    password: 'password123',
  }),
  validTestUser: () => ({
    email: 'test@example.com',
    password: 'password123',
  }),
  invalidUnregistered: () => ({
    email: 'tidakada@example.com',
    password: 'password123',
  }),
  invalidWrongPassword: () => ({
    email: 'admin@example.com',
    password: 'SalahPassword1!',
  }),
  invalidEmailFormat: () => ({
    email: 'adminexample.com',
    password: 'password123',
  }),
  emptyEmail: () => ({
    email: '',
    password: 'password123',
  }),
  emptyPassword: () => ({
    email: 'admin@example.com',
    password: '',
  }),
  allEmpty: () => ({
    email: '',
    password: '',
  }),

  // Using faker only for register as requested
  randomRegisterUser: () => ({
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'Password123!',
  })
};

export const ProductBuilder = {
  validProduct: () => {
    const timestamp = Date.now();
    return {
      name: `Sepatu Baru ${timestamp}`,
      category: 'Sports',
      price: 150000,
      stock: 50
    };
  },
  negativePriceProduct: () => {
    const timestamp = Date.now();
    return {
      name: `Produk Gagal ${timestamp}`,
      category: 'Electronics',
      price: -1,
      stock: 10
    };
  }
};

export const SupportBuilder = {
  validTicket: () => {
    const timestamp = Date.now();
    return {
      name: 'User Support',
      email: `support.${timestamp}@example.com`,
      subject: 'Billing',
      priority: 'low',
      message: 'Halo, saya membutuhkan bantuan terkait dengan tagihan saya yang tidak sesuai.'
    };
  },
  shortMessageTicket: () => {
    const timestamp = Date.now();
    return {
      name: 'User Support',
      email: `support.${timestamp}@example.com`,
      subject: 'General Inquiry',
      priority: 'low',
      message: 'Halo'
    };
  }
};

export interface UserData {
  fullName?: string;
  email: string;
  password?: string;
}

export interface AddressData {
  street: string;
  city: string;
  zip: string;
}

export interface PaymentData {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface OrderData {
  id?: string;
  userId?: string;
  items?: string[];
  total?: number;
}

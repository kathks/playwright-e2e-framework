/** Product names used as stable, user-visible anchors for locators. */
export const products = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  fleeceJacket: 'Sauce Labs Fleece Jacket',
  onesie: 'Sauce Labs Onesie',
  redTShirt: 'Test.allTheThings() T-Shirt (Red)',
} as const;

export type ProductName = (typeof products)[keyof typeof products];

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const defaultCustomer: CustomerDetails = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '6000',
};

/** SauceDemo applies a fixed 8% sales tax on the order subtotal. */
export const TAX_RATE = 0.08;

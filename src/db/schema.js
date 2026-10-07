import { pgTable, text, integer, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // cth: ORD-DA-123456
  userId: text('user_id').references(() => users.id),
  
  // Product Details
  themeId: text('theme_id').notNull(),
  themeName: text('theme_name').notNull(),
  
  // Dashboard & Queue Info

  clientName: text('client_name').notNull().default('Tanpa Nama'),
  eventType: text('event_type').notNull().default('Lainnya'),
  eventDate: timestamp('event_date').notNull(),
  
  // Aggregate Data
  packageData: jsonb('package_data').notNull(),
  clientPhotos: jsonb('client_photos'),
  
  // Financials
  basePrice: integer('base_price').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  discountedBase: integer('discounted_base').notNull().default(0),
  addonPrice: integer('addon_price').notNull().default(0),
  subtotal: integer('subtotal').notNull().default(0),
  serviceFee: integer('service_fee').notNull().default(0),
  totalPrice: integer('total_price').notNull(),
  promoCode: text('promo_code'),
  commissionAmount: integer('commission_amount').notNull().default(0),
  paymentStatus: text('payment_status').default('unpaid').notNull(),
  paymentMethod: text('payment_method'),
  
  // Operational Queue
  status: text('status').notNull().default('pending'),
  isPriority: boolean('is_priority').default(false).notNull(),
  agentId: text('agent_id').references(() => users.id),
  
  // SLA Tracking
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  revisionCount: integer('revision_count').default(0).notNull(),
  
  // Internal Notes
  internalNotes: text('internal_notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const drafts = pgTable('drafts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  themeId: text('theme_id').notNull(),
  themeName: text('theme_name').notNull(),
  formData: jsonb('form_data').notNull(), // Draft form payload
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const favorites = pgTable('favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  productId: text('product_id').notNull(), // Reference to catalog product
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull().default(127000),
  status: text('status').notNull().default('Aktif'),
  previewImage: text('preview_image'),
  videoUrl: text('video_url'),
  previewUrl: text('preview_url'),
  features: jsonb('features'),
  tags: jsonb('tags'),
  colors: jsonb('colors'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pricing_addons = pgTable('pricing_addons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promocodes = pgTable('promocodes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountPercent: integer('discount_percent').notNull(),
  used: integer('used').default(0).notNull(),
  quota: integer('quota').notNull(),
  agentId: text('agent_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  clientName: text('client_name').notNull(),
  themeName: text('theme_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  status: text('status').notNull().default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payouts = pgTable('payouts', {
  id: text('id').primaryKey(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('Pending'),
  destination: text('destination').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  category: text('category').notNull(),
  date: timestamp('date').defaultNow().notNull(),
  status: text('status').notNull().default('Lunas'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const withdrawals = pgTable('withdrawals', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  adminFee: integer('admin_fee').notNull().default(2500),
  paymentMethod: text('payment_method').notNull().default(''),
  accountNumber: text('account_number').notNull().default(''),
  status: text('status').default('pending').notNull(),
  proofUrl: text('proof_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

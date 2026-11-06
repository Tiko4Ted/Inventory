import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  sku: varchar('sku', { length: 80 }),
  category: varchar('category', { length: 120 }),
  unit: varchar('unit', { length: 40 }).notNull(),
  currentQuantity: integer('current_quantity').notNull().default(0),
  minimumQuantity: integer('minimum_quantity').notNull().default(0),
  batchNumber: varchar('batch_number', { length: 120 }),
  expiryDate: timestamp('expiry_date', { withTimezone: false, mode: 'date' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => inventoryItems.id),
  movementType: varchar('movement_type', { length: 30 }).notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  reason: text('reason').notNull(),
  source: varchar('source', { length: 30 }).notNull().default('manual'),
  shelfScanId: uuid('shelf_scan_id'),
  actorId: varchar('actor_id', { length: 200 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const shelfScans = pgTable('shelf_scans', {
  id: uuid('id').defaultRandom().primaryKey(),
  imageUrl: text('image_url').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('processing'),
  rawAnalysis: jsonb('raw_analysis'),
  createdBy: varchar('created_by', { length: 200 }).notNull(),
  reviewedBy: varchar('reviewed_by', { length: 200 }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const shelfScanLines = pgTable('shelf_scan_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  scanId: uuid('scan_id')
    .notNull()
    .references(() => shelfScans.id),
  productLabel: varchar('product_label', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 40 }),
  batchNumber: varchar('batch_number', { length: 120 }),
  expiryDate: timestamp('expiry_date', { withTimezone: false, mode: 'date' }),
  confidence: integer('confidence_basis_points').notNull(),
  reviewStatus: varchar('review_status', { length: 30 }).notNull().default('pending'),
  reviewerNote: text('reviewer_note'),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: varchar('actor_id', { length: 200 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

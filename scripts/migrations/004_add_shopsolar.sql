-- Migration 004: Add Shop Solar Kits retailer + external ID columns for Shopify variants

-- Add external product/variant IDs to kit_offers (for Shopify and other non-Amazon retailers)
ALTER TABLE kit_offers ADD COLUMN IF NOT EXISTS external_product_id TEXT;
ALTER TABLE kit_offers ADD COLUMN IF NOT EXISTS external_variant_id TEXT;

-- Add external product/variant IDs to product_offers too (future-proofing)
ALTER TABLE product_offers ADD COLUMN IF NOT EXISTS external_product_id TEXT;
ALTER TABLE product_offers ADD COLUMN IF NOT EXISTS external_variant_id TEXT;

-- Insert Shop Solar Kits retailer (idempotent)
INSERT INTO retailers (id, name, slug, retailer_type, is_active)
VALUES (gen_random_uuid(), 'Shop Solar Kits', 'shop-solar-kits', 'direct', true)
ON CONFLICT (slug) DO NOTHING;

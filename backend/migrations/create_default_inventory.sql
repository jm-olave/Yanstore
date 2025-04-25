-- Create inventory records for products that don't have them
INSERT INTO inventory (product_id, quantity, available_quantity, reserved_quantity, reorder_point)
SELECT p.product_id, 1, 1, 0, 0
FROM products p
LEFT JOIN inventory i ON p.product_id = i.product_id
WHERE i.inventory_id IS NULL;
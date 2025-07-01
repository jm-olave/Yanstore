# Product to ProductInstance Migration

## Overview

This migration addresses the transition from the old Product-only model to the new Product + ProductInstance model. The new architecture separates product definitions from individual inventory instances, allowing for better inventory management.

## Architecture

### Before Migration
- **Product table**: Contains both product definitions and inventory data
- **Inventory page**: Shows products directly

### After Migration
- **Product table**: Contains product definitions (name, description, category, etc.)
- **ProductInstance table**: Contains individual instances with specific costs, locations, and status
- **Inventory page**: Shows ProductInstance records with their associated Product data

## Why This Migration?

This separation provides several benefits:

1. **Better Inventory Management**: Track individual items separately
2. **Multiple Instances**: Same product can have multiple instances with different costs/locations
3. **Status Tracking**: Individual items can be marked as available, sold, or reserved
4. **Cost Tracking**: Each instance can have its own base cost
5. **Location Management**: Individual items can be in different locations

## Migration Process

### Option 1: Using the Frontend Button (Recommended)

1. Navigate to the **Inventory** page
2. If no products are displayed, you'll see a "Migrate Products to Instances" button
3. Click the button and confirm the migration
4. The system will automatically create ProductInstance records for all existing Products
5. The page will refresh and show your inventory

### Option 2: Using the API Endpoint

```bash
curl -X POST http://localhost:8000/migrate-products-to-instances/
```

### Option 3: Using the Python Script

```bash
cd backend
python migrate_products_to_instances.py
```

## What the Migration Does

For each existing Product without a ProductInstance:

1. **Finds the base cost**: Uses the most recent PricePoint record, or defaults to $0.00
2. **Creates ProductInstance**: With the following data:
   - `product_id`: Links to the existing Product
   - `base_cost`: From PricePoint or default
   - `status`: Set to 'available'
   - `purchase_date`: Uses Product's purchase_date or today's date
   - `location`: Uses Product's location or defaults to 'Colombia'

## Verification

After migration, you can verify success by:

1. **Frontend**: Check that products appear in the Inventory page
2. **API**: Call `/instances/` endpoint to see all ProductInstance records
3. **Database**: Query the `product_instances` table

## Rollback (If Needed)

If you need to rollback the migration:

```bash
cd backend
python migrate_products_to_instances.py --rollback
```

**Warning**: This will delete ALL ProductInstance records, not just those created by the migration.

## Best Practices

### Before Migration
1. **Backup your database** before running any migration
2. **Test in development** environment first
3. **Review existing data** to understand what will be migrated

### After Migration
1. **Verify data integrity** by checking a few sample records
2. **Update your workflows** to use ProductInstance for inventory operations
3. **Train users** on the new inventory management approach

## Troubleshooting

### Common Issues

1. **"No products need migration"**
   - All products already have ProductInstance records
   - No action needed

2. **"Migration failed"**
   - Check the backend logs for detailed error messages
   - Verify database connectivity
   - Ensure all required tables exist

3. **Products still don't appear in inventory**
   - Check if the ProductInstance records were created successfully
   - Verify the frontend is calling the correct API endpoint (`/instances/`)
   - Clear browser cache and refresh

### Getting Help

If you encounter issues:

1. Check the migration logs in `backend/migration.log`
2. Review the backend console output
3. Verify database schema matches the expected structure
4. Contact the development team with specific error messages

## Future Considerations

After migration, consider:

1. **Updating product creation workflows** to automatically create ProductInstance records
2. **Implementing bulk operations** for managing multiple instances
3. **Adding inventory alerts** for low stock or aging items
4. **Creating reports** that leverage the new instance-based data structure 
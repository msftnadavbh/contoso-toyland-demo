"""
Contoso Toyland - Order Processor (Python)
Processes orders from the data/orders.csv file and logs results.
"""
import csv
import logging
import os
import sys
import traceback

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure "noisy" logging to simulate real production environment
logging.basicConfig(
    filename='logs/python.log',
    filemode='w',  # Overwrite each run for demo clarity
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - [OrderProcessor] - %(message)s'
)

logger = logging.getLogger(__name__)


def validate_inventory(product_id):
    """Simulates inventory check - adds noise to logs."""
    logger.debug(f"Checking inventory for product: {product_id}")
    logger.debug(f"Inventory check passed for {product_id}")
    return True


def calculate_shipping(quantity):
    """Simulates shipping calculation - adds noise to logs."""
    logger.debug(f"Calculating shipping for {quantity} items")
    base_rate = 5.99
    per_item = 1.50
    shipping = base_rate + (quantity * per_item)
    logger.debug(f"Shipping calculated: ${shipping:.2f}")
    return shipping


# Global discount cache - simulates a caching layer
_discount_cache = {}

def get_discount_tier(product_name):
    """
    Returns discount tier based on product category.
    BUG: Accessing dictionary key that doesn't exist!
    """
    tiers = {
        "toy": 0.10,
        "game": 0.15,
        "puzzle": 0.12
    }
    # BUG: product_name.lower() might not match any key - returns None then used in math
    category = product_name.lower().split()[0] if product_name else "unknown"
    return tiers.get(category)  # Returns None if not found - causes TypeError later!


def apply_holiday_discount(total, order_id, product_name=None):
    """
    Applies the holiday discount for the January Rush sale.
    BUG: Multiple issues - None handling, division, caching!
    """
    logger.info(f"Applying holiday discount for order {order_id}")
    
    # BUG 1: get_discount_tier can return None
    tier_discount = get_discount_tier(product_name)
    base_rate = 0.15
    
    # BUG 2: If tier_discount is None, this causes TypeError: unsupported operand type(s)
    discount_rate = base_rate + tier_discount
    
    # BUG 3: Division by zero when total is 0
    if order_id in _discount_cache:
        # Simulate cache hit ratio calculation
        cache_bonus = _discount_cache[order_id] / total  # ZeroDivisionError if total=0
        discount_rate += cache_bonus
    
    discount_amount = total * discount_rate
    final_price = total - discount_amount
    
    # Cache this discount for "analytics"
    _discount_cache[order_id] = discount_amount
    
    logger.debug(f"Discount applied: ${discount_amount:.2f} off, new total: ${final_price:.2f}")
    return final_price


def process_order(order):
    """
    Main order processing function.
    Processes a single order and returns success/failure status.
    """
    order_id = order.get('order_id', 'UNKNOWN')
    
    try:
        logger.info(f"========== Processing Order {order_id} ==========")
        logger.info(f"Customer order received: {order['product_name']}")
        
        # Step 1: Parse and validate quantity
        logger.debug(f"Parsing quantity value: '{order['quantity']}'")
        qty = int(order['quantity'])
        
        # Step 2: Parse and validate price
        logger.debug(f"Parsing unit price value: '{order['unit_price']}'")
        price = float(order['unit_price'])
        
        # Step 3: Business rule validation
        if qty < 0:
            raise ValueError(f"Quantity cannot be negative. Received: {qty}")
        
        if qty == 0:
            logger.warning(f"Order {order_id} has zero quantity - flagging for review")
        
        # Step 4: Inventory check
        validate_inventory(order['product_id'])
        
        # Step 5: Calculate totals
        subtotal = qty * price
        logger.debug(f"Subtotal calculated: {qty} x ${price:.2f} = ${subtotal:.2f}")
        
        # Step 6: Apply holiday discount
        discounted_total = apply_holiday_discount(subtotal, order_id, order['product_name'])
        
        # Step 7: Calculate tax
        tax_rate = 0.08
        tax = discounted_total * tax_rate
        logger.debug(f"Tax calculated: ${tax:.2f}")
        
        # Step 8: Calculate shipping
        shipping = calculate_shipping(qty)
        
        # Step 9: Final total
        final_total = discounted_total + tax + shipping
        
        logger.info(f"Order {order_id} processed successfully!")
        logger.info(f"  Product: {order['product_name']}")
        logger.info(f"  Subtotal: ${subtotal:.2f}")
        logger.info(f"  After Discount: ${discounted_total:.2f}")
        logger.info(f"  Tax: ${tax:.2f}")
        logger.info(f"  Shipping: ${shipping:.2f}")
        logger.info(f"  FINAL TOTAL: ${final_total:.2f}")
        logger.info(f"========== Order {order_id} Complete ==========\n")
        
        return True

    except ValueError as ve:
        logger.error(f"VALIDATION ERROR on order {order_id}: {str(ve)}")
        logger.error(f"  Raw data - Qty: '{order.get('quantity')}', Price: '{order.get('unit_price')}'")
        logger.debug(f"Stack trace: {traceback.format_exc()}")
        return False
        
    except Exception as e:
        logger.critical(f"CRITICAL SYSTEM FAILURE processing order {order_id}")
        logger.critical(f"  Error Type: {type(e).__name__}")
        logger.critical(f"  Error Message: {str(e)}")
        logger.critical(f"  Full Stack Trace:\n{traceback.format_exc()}")
        return False


def main():
    """Main entry point for the order processor."""
    # Resolve path relative to this script's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, '..', 'data', 'orders.csv')
    
    print("=" * 60)
    print("  CONTOSO TOYLAND - Order Processing System (Python)")
    print("  Holiday Rush Batch Processor v2.1")
    print("=" * 60)
    
    logger.info("=" * 60)
    logger.info("CONTOSO TOYLAND ORDER PROCESSOR STARTED")
    logger.info(f"Processing file: {csv_path}")
    logger.info("=" * 60)
    
    if not os.path.exists(csv_path):
        error_msg = f"FATAL: Data file not found at {csv_path}"
        print(error_msg)
        logger.critical(error_msg)
        return

    success_count = 0
    error_count = 0
    total_orders = 0

    with open(csv_path, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            total_orders += 1
            if process_order(row):
                success_count += 1
            else:
                error_count += 1
    
    # Summary
    logger.info("=" * 60)
    logger.info("BATCH PROCESSING COMPLETE")
    logger.info(f"  Total Orders: {total_orders}")
    logger.info(f"  Successful: {success_count}")
    logger.info(f"  Failed: {error_count}")
    logger.info("=" * 60)
    
    print(f"\nProcessing complete!")
    print(f"  Total Orders: {total_orders}")
    print(f"  Successful:   {success_count}")
    print(f"  Failed:       {error_count}")
    print(f"\nCheck logs/python.log for detailed output.")


if __name__ == "__main__":
    main()

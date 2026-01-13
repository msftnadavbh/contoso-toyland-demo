"""
Contoso Toyland - Order Processor (Python) - FIXED VERSION
This is the corrected version for reference after the demo.
Compare with processor.py to see the bugs that were fixed.
"""
import csv
import logging
import os
import sys
import traceback

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Configure logging
logging.basicConfig(
    filename='logs/python_fixed.log',
    filemode='w',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - [OrderProcessor] - %(message)s'
)

logger = logging.getLogger(__name__)


def validate_inventory(product_id):
    """Simulates inventory check."""
    logger.debug(f"Checking inventory for product: {product_id}")
    logger.debug(f"Inventory check passed for {product_id}")
    return True


def calculate_shipping(quantity):
    """Simulates shipping calculation."""
    logger.debug(f"Calculating shipping for {quantity} items")
    base_rate = 5.99
    per_item = 1.50
    shipping = base_rate + (quantity * per_item)
    logger.debug(f"Shipping calculated: ${shipping:.2f}")
    return shipping


# Global discount cache
_discount_cache = {}


def get_discount_tier(product_name):
    """
    Returns discount tier based on product category.
    FIX: Returns 0.0 as default instead of None!
    """
    tiers = {
        "toy": 0.10,
        "game": 0.15,
        "puzzle": 0.12,
        "fast": 0.10,      # Added for "Fast Racer"
        "giant": 0.08,     # Added for "Giant Teddy Bear"
        "building": 0.10,  # Added for "Building Blocks"
        "board": 0.15,     # Added for "Board Game"
        "action": 0.12,    # Added for "Action Figure"
        "robot": 0.15,     # Added for "Robot Dog"
        "soccer": 0.05,    # Added for "Soccer Ball"
        "painting": 0.08,  # Added for "Painting Set"
        "mystery": 0.10,   # Added for "Mystery Box"
        "empty": 0.05,     # Added for "Empty Product"
        "drone": 0.12,     # Added for "Drone Flyer"
        "1000": 0.10,      # Added for "1000 Piece Puzzle"
    }
    
    if not product_name:
        logger.warning("Empty product name, using default discount tier")
        return 0.0
    
    category = product_name.lower().split()[0]
    # FIX: Return 0.0 as default instead of None
    return tiers.get(category, 0.0)


def apply_holiday_discount(total, order_id, product_name=None):
    """
    Applies the holiday discount for the January Rush sale.
    FIX: Handles None, zero totals, and edge cases safely!
    """
    logger.info(f"Applying holiday discount for order {order_id}")
    
    # FIX 1: Handle None from get_discount_tier
    tier_discount = get_discount_tier(product_name)
    if tier_discount is None:
        tier_discount = 0.0
        logger.warning(f"No tier discount found for '{product_name}', using 0")
    
    base_rate = 0.15
    discount_rate = base_rate + tier_discount
    
    # FIX 2: Check for zero total before division
    if order_id in _discount_cache and total > 0:
        cache_bonus = _discount_cache[order_id] / total
        discount_rate += cache_bonus
    
    # FIX 3: Cap discount at 50% to prevent negative prices
    discount_rate = min(discount_rate, 0.50)
    
    discount_amount = total * discount_rate
    final_price = total - discount_amount
    
    _discount_cache[order_id] = discount_amount
    
    logger.debug(f"Discount applied: ${discount_amount:.2f} off, new total: ${final_price:.2f}")
    return final_price


def process_order(order):
    """
    Main order processing function.
    FIX: Better error handling and validation.
    """
    order_id = order.get('order_id', 'UNKNOWN')
    
    try:
        logger.info(f"========== Processing Order {order_id} ==========")
        logger.info(f"Customer order received: {order.get('product_name', 'Unknown Product')}")
        
        # FIX: Validate data before parsing
        qty_str = order.get('quantity', '0')
        price_str = order.get('unit_price', '0')
        
        # Step 1: Parse and validate quantity
        logger.debug(f"Parsing quantity value: '{qty_str}'")
        try:
            qty = int(qty_str)
        except ValueError:
            logger.error(f"Invalid quantity '{qty_str}' - must be a number")
            return False
        
        # Step 2: Parse and validate price
        logger.debug(f"Parsing unit price value: '{price_str}'")
        try:
            price = float(price_str)
        except ValueError:
            logger.error(f"Invalid price '{price_str}' - must be a number")
            return False
        
        # Step 3: Business rule validation
        if qty < 0:
            logger.error(f"Order {order_id}: Quantity cannot be negative ({qty})")
            return False
        
        if qty == 0:
            logger.warning(f"Order {order_id} has zero quantity - flagging for review")
            # Continue processing but flag it
        
        if price < 0:
            logger.error(f"Order {order_id}: Price cannot be negative (${price})")
            return False
        
        # Step 4: Inventory check
        validate_inventory(order.get('product_id', 'UNKNOWN'))
        
        # Step 5: Calculate totals
        subtotal = qty * price
        logger.debug(f"Subtotal calculated: {qty} x ${price:.2f} = ${subtotal:.2f}")
        
        # Step 6: Apply holiday discount
        discounted_total = apply_holiday_discount(subtotal, order_id, order.get('product_name'))
        
        # Step 7: Calculate tax
        tax_rate = 0.08
        tax = discounted_total * tax_rate
        logger.debug(f"Tax calculated: ${tax:.2f}")
        
        # Step 8: Calculate shipping
        shipping = calculate_shipping(qty)
        
        # Step 9: Final total
        final_total = discounted_total + tax + shipping
        
        logger.info(f"Order {order_id} processed successfully!")
        logger.info(f"  Customer: {order.get('customer_name', 'Unknown')}")
        logger.info(f"  Product: {order.get('product_name', 'Unknown')}")
        logger.info(f"  Subtotal: ${subtotal:.2f}")
        logger.info(f"  After Discount: ${discounted_total:.2f}")
        logger.info(f"  Tax: ${tax:.2f}")
        logger.info(f"  Shipping: ${shipping:.2f}")
        logger.info(f"  FINAL TOTAL: ${final_total:.2f}")
        logger.info(f"========== Order {order_id} Complete ==========\n")
        
        return True

    except Exception as e:
        logger.critical(f"UNEXPECTED ERROR processing order {order_id}")
        logger.critical(f"  Error Type: {type(e).__name__}")
        logger.critical(f"  Error Message: {str(e)}")
        logger.critical(f"  Full Stack Trace:\n{traceback.format_exc()}")
        return False


def main():
    """Main entry point for the order processor."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, '..', 'data', 'orders.csv')
    
    print("=" * 60)
    print("  CONTOSO TOYLAND - Order Processing System (Python FIXED)")
    print("  Holiday Rush Batch Processor v2.1 - CORRECTED")
    print("=" * 60)
    
    logger.info("=" * 60)
    logger.info("CONTOSO TOYLAND ORDER PROCESSOR STARTED (FIXED VERSION)")
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
    print(f"\nCheck logs/python_fixed.log for detailed output.")


if __name__ == "__main__":
    main()

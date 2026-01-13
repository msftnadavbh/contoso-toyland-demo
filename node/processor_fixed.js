/**
 * Contoso Toyland - Order Processor (Node.js) - FIXED VERSION
 * This is the corrected version for reference after the demo.
 * Compare with processor.js to see the bugs that were fixed.
 */
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'node_fixed.log');

// Clear log file at start
fs.writeFileSync(logFile, '');

/**
 * Writes a formatted log entry to the log file
 */
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${level.padEnd(8)} - [OrderProcessor] - ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
}

/**
 * Simulates inventory check
 */
function validateInventory(productId) {
    log('DEBUG', `Checking inventory for product: ${productId}`);
    log('DEBUG', `Inventory check passed for ${productId}`);
    return true;
}

/**
 * Simulates shipping calculation
 */
function calculateShipping(quantity) {
    log('DEBUG', `Calculating shipping for ${quantity} items`);
    const baseRate = 5.99;
    const perItem = 1.50;
    const shipping = baseRate + (quantity * perItem);
    log('DEBUG', `Shipping calculated: $${shipping.toFixed(2)}`);
    return shipping;
}

// FIX: Initialize config immediately instead of lazy loading
const discountConfig = {
    baseRate: 0.15,
    bonusCategories: ['RC', 'Robot', 'EL'],
    maxDiscount: 0.50  // FIX: Cap at 50%
};

let orderHistory = [];

/**
 * Gets bonus rate based on product ID
 * FIX: Validates array bounds before access!
 */
function getBonusRate(productId) {
    // FIX: Validate productId exists and has correct format
    if (!productId || typeof productId !== 'string') {
        log('WARNING', `Invalid product ID: ${productId}`);
        return 0;
    }
    
    const parts = productId.split('-');
    
    // FIX: Check array bounds before accessing
    if (parts.length < 2) {
        log('WARNING', `Malformed product ID: ${productId} (expected format: XXX-YY-ZZZ)`);
        return 0;
    }
    
    const category = parts[1].toUpperCase();
    
    if (discountConfig.bonusCategories.includes(category)) {
        return 0.05;
    }
    return 0;
}

/**
 * Calculates loyalty bonus from order history
 * FIX: Corrected off-by-one error!
 */
function getLoyaltyBonus(orderId) {
    // FIX: Check history BEFORE adding current order
    const previousOrder = orderHistory.length > 0 
        ? orderHistory[orderHistory.length - 1]  // FIX: -1 not missing!
        : null;
    
    // Now add current order to history
    orderHistory.push(orderId);
    
    // FIX: Safe access with null check
    if (previousOrder && previousOrder.startsWith('CT-100')) {
        return 0.02;
    }
    return 0;
}

/**
 * Applies the holiday discount for the January Rush sale.
 * FIX: All issues resolved - null refs, array bounds, race conditions!
 */
function applyHolidayDiscount(total, orderId, productId) {
    log('INFO', `Applying holiday discount for order ${orderId}`);
    
    // FIX: Config is always available (initialized at module load)
    let discountRate = discountConfig.baseRate;
    
    // FIX: getBonusRate now validates inputs
    discountRate += getBonusRate(productId);
    
    // FIX: getLoyaltyBonus now handles off-by-one
    discountRate += getLoyaltyBonus(orderId);
    
    // FIX: Cap discount to prevent negative prices
    discountRate = Math.min(discountRate, discountConfig.maxDiscount);
    
    const discountAmount = total * discountRate;
    const finalPrice = total - discountAmount;
    
    log('DEBUG', `Discount applied: $${discountAmount.toFixed(2)} off, new total: $${finalPrice.toFixed(2)}`);
    return finalPrice;
}

/**
 * Main order processing function.
 * FIX: Better validation and error handling.
 */
function processOrder(order) {
    const orderId = order.order_id || 'UNKNOWN';
    
    try {
        log('INFO', `========== Processing Order ${orderId} ==========`);
        log('INFO', `Customer: ${order.customer_name || 'Unknown'}`);
        log('INFO', `Product: ${order.product_name}`);
        
        // Step 1: Parse and validate quantity
        log('DEBUG', `Parsing quantity value: '${order.quantity}'`);
        const qty = parseInt(order.quantity, 10);
        
        // Step 2: Parse and validate price
        log('DEBUG', `Parsing unit price value: '${order.unit_price}'`);
        const price = parseFloat(order.unit_price);
        
        // FIX: More descriptive error messages
        if (isNaN(qty)) {
            log('ERROR', `Invalid quantity '${order.quantity}' for order ${orderId} - skipping`);
            return false;
        }
        
        if (isNaN(price)) {
            log('ERROR', `Invalid price '${order.unit_price}' for order ${orderId} - skipping`);
            return false;
        }
        
        // Step 3: Business rule validation
        if (qty < 0) {
            log('ERROR', `Negative quantity (${qty}) for order ${orderId} - skipping`);
            return false;
        }
        
        if (qty === 0) {
            log('WARNING', `Order ${orderId} has zero quantity - flagging for review`);
        }
        
        if (price < 0) {
            log('ERROR', `Negative price ($${price}) for order ${orderId} - skipping`);
            return false;
        }
        
        // Step 4: Inventory check
        validateInventory(order.product_id);
        
        // Step 5: Calculate totals
        const subtotal = qty * price;
        log('DEBUG', `Subtotal calculated: ${qty} x $${price.toFixed(2)} = $${subtotal.toFixed(2)}`);
        
        // Step 6: Apply holiday discount
        const discountedTotal = applyHolidayDiscount(subtotal, orderId, order.product_id);
        
        // Step 7: Calculate tax
        const taxRate = 0.08;
        const tax = discountedTotal * taxRate;
        log('DEBUG', `Tax calculated: $${tax.toFixed(2)}`);
        
        // Step 8: Calculate shipping
        const shipping = calculateShipping(qty);
        
        // Step 9: Final total
        const finalTotal = discountedTotal + tax + shipping;
        
        log('INFO', `Order ${orderId} processed successfully!`);
        log('INFO', `  Customer: ${order.customer_name || 'Unknown'}`);
        log('INFO', `  Product: ${order.product_name}`);
        log('INFO', `  Subtotal: $${subtotal.toFixed(2)}`);
        log('INFO', `  After Discount: $${discountedTotal.toFixed(2)}`);
        log('INFO', `  Tax: $${tax.toFixed(2)}`);
        log('INFO', `  Shipping: $${shipping.toFixed(2)}`);
        log('INFO', `  FINAL TOTAL: $${finalTotal.toFixed(2)}`);
        log('INFO', `========== Order ${orderId} Complete ==========\n`);
        
        return true;

    } catch (error) {
        log('CRITICAL', `UNEXPECTED ERROR on order ${orderId}: ${error.message}`);
        log('CRITICAL', `Stack trace: ${error.stack}`);
        return false;
    }
}

/**
 * Parses CSV content into array of objects
 */
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const record = {};
        headers.forEach((header, index) => {
            record[header] = values[index] ? values[index].trim() : '';
        });
        records.push(record);
    }
    
    return records;
}

/**
 * Main entry point for the order processor
 */
function main() {
    const csvPath = path.join(__dirname, '..', 'data', 'orders.csv');
    
    console.log('='.repeat(60));
    console.log('  CONTOSO TOYLAND - Order Processing System (Node.js FIXED)');
    console.log('  Holiday Rush Batch Processor v2.1 - CORRECTED');
    console.log('='.repeat(60));
    
    log('INFO', '='.repeat(60));
    log('INFO', 'CONTOSO TOYLAND ORDER PROCESSOR STARTED (FIXED VERSION)');
    log('INFO', `Processing file: ${csvPath}`);
    log('INFO', '='.repeat(60));
    
    if (!fs.existsSync(csvPath)) {
        const errorMsg = `FATAL: Data file not found at ${csvPath}`;
        console.error(errorMsg);
        log('CRITICAL', errorMsg);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const orders = parseCSV(content);
    
    let successCount = 0;
    let errorCount = 0;
    const totalOrders = orders.length;

    for (const order of orders) {
        if (processOrder(order)) {
            successCount++;
        } else {
            errorCount++;
        }
    }
    
    // Summary
    log('INFO', '='.repeat(60));
    log('INFO', 'BATCH PROCESSING COMPLETE');
    log('INFO', `  Total Orders: ${totalOrders}`);
    log('INFO', `  Successful: ${successCount}`);
    log('INFO', `  Failed: ${errorCount}`);
    log('INFO', '='.repeat(60));
    
    console.log('\nProcessing complete!');
    console.log(`  Total Orders: ${totalOrders}`);
    console.log(`  Successful:   ${successCount}`);
    console.log(`  Failed:       ${errorCount}`);
    console.log('\nCheck logs/node_fixed.log for detailed output.');
}

main();

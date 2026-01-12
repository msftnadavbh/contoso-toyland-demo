/**
 * Contoso Toyland - Order Processor (Node.js)
 * Processes orders from the data/orders.csv file and logs results.
 */
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'node.log');

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
 * Simulates inventory check - adds noise to logs
 */
function validateInventory(productId) {
    log('DEBUG', `Checking inventory for product: ${productId}`);
    log('DEBUG', `Inventory check passed for ${productId}`);
    return true;
}

/**
 * Simulates shipping calculation - adds noise to logs
 */
function calculateShipping(quantity) {
    log('DEBUG', `Calculating shipping for ${quantity} items`);
    const baseRate = 5.99;
    const perItem = 1.50;
    const shipping = baseRate + (quantity * perItem);
    log('DEBUG', `Shipping calculated: $${shipping.toFixed(2)}`);
    return shipping;
}

// Global state - simulates external config
let discountConfig = null;
let orderHistory = [];

/**
 * Loads discount configuration from "external source"
 * BUG: Race condition - config might not be loaded!
 */
function loadDiscountConfig() {
    // Simulates async config load that sometimes fails
    if (Math.random() > 0.3) {
        discountConfig = {
            baseRate: 0.15,
            bonusCategories: ['RC', 'Robot'],
            maxDiscount: 0.25
        };
    }
    // BUG: Sometimes discountConfig stays null!
}

/**
 * Gets bonus rate based on product ID
 * BUG: Array index out of bounds!
 */
function getBonusRate(productId) {
    const parts = productId.split('-');
    // BUG: Assumes parts[1] exists - crashes on malformed IDs
    const category = parts[1].toUpperCase();
    
    // BUG: Accessing property of potentially null discountConfig
    if (discountConfig.bonusCategories.includes(category)) {
        return 0.05;
    }
    return 0;
}

/**
 * Calculates loyalty bonus from order history
 * BUG: Off-by-one error and undefined access!
 */
function getLoyaltyBonus(orderId) {
    orderHistory.push(orderId);
    
    // BUG: Off-by-one - accesses index that doesn't exist yet
    const previousOrder = orderHistory[orderHistory.length];
    
    // BUG: Calling method on undefined
    if (previousOrder && previousOrder.startsWith('CT-100')) {
        return 0.02;
    }
    return 0;
}

/**
 * Applies the holiday discount for the January Rush sale.
 * BUG: Multiple issues - null refs, array bounds, race conditions!
 */
function applyHolidayDiscount(total, orderId, productId) {
    log('INFO', `Applying holiday discount for order ${orderId}`);
    
    // Load config (might fail silently)
    loadDiscountConfig();
    
    // BUG 1: discountConfig might be null here
    let discountRate = discountConfig.baseRate;
    
    // BUG 2: getBonusRate has array index issues
    discountRate += getBonusRate(productId);
    
    // BUG 3: getLoyaltyBonus has off-by-one error
    discountRate += getLoyaltyBonus(orderId);
    
    // BUG 4: No cap check - discount could exceed 100%
    const discountAmount = total * discountRate;
    const finalPrice = total - discountAmount;
    
    log('DEBUG', `Discount applied: $${discountAmount.toFixed(2)} off, new total: $${finalPrice.toFixed(2)}`);
    return finalPrice;
}

/**
 * Main order processing function.
 * Processes a single order and returns success/failure status.
 */
function processOrder(order) {
    const orderId = order.order_id || 'UNKNOWN';
    
    try {
        log('INFO', `========== Processing Order ${orderId} ==========`);
        log('INFO', `Customer order received: ${order.product_name}`);
        
        // Step 1: Parse and validate quantity
        log('DEBUG', `Parsing quantity value: '${order.quantity}'`);
        const qty = parseInt(order.quantity, 10);
        
        // Step 2: Parse and validate price
        log('DEBUG', `Parsing unit price value: '${order.unit_price}'`);
        const price = parseFloat(order.unit_price);
        
        // Check for parsing failures
        if (isNaN(qty)) {
            throw new Error(`Invalid quantity value: '${order.quantity}' is not a number`);
        }
        
        if (isNaN(price)) {
            throw new Error(`Invalid price value: '${order.unit_price}' is not a number`);
        }
        
        // Step 3: Business rule validation
        if (qty < 0) {
            throw new Error(`Quantity cannot be negative. Received: ${qty}`);
        }
        
        if (qty === 0) {
            log('WARNING', `Order ${orderId} has zero quantity - flagging for review`);
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
        log('INFO', `  Product: ${order.product_name}`);
        log('INFO', `  Subtotal: $${subtotal.toFixed(2)}`);
        log('INFO', `  After Discount: $${discountedTotal.toFixed(2)}`);
        log('INFO', `  Tax: $${tax.toFixed(2)}`);
        log('INFO', `  Shipping: $${shipping.toFixed(2)}`);
        log('INFO', `  FINAL TOTAL: $${finalTotal.toFixed(2)}`);
        log('INFO', `========== Order ${orderId} Complete ==========\n`);
        
        return true;

    } catch (error) {
        log('ERROR', `VALIDATION ERROR on order ${orderId}: ${error.message}`);
        log('ERROR', `  Raw data - Qty: '${order.quantity}', Price: '${order.unit_price}'`);
        
        // Log stack trace for debugging
        if (error.message.includes('not a number')) {
            log('CRITICAL', `DATA CORRUPTION detected in order ${orderId}`);
            log('CRITICAL', `  This indicates malformed CSV data or upstream system failure`);
            log('CRITICAL', `  Stack trace: ${error.stack}`);
        }
        
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
    console.log('  CONTOSO TOYLAND - Order Processing System (Node.js)');
    console.log('  Holiday Rush Batch Processor v2.1');
    console.log('='.repeat(60));
    
    log('INFO', '='.repeat(60));
    log('INFO', 'CONTOSO TOYLAND ORDER PROCESSOR STARTED');
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
    console.log('\nCheck logs/node.log for detailed output.');
}

main();

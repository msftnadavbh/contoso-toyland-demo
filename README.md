# 🧸 Contoso Toyland - Log Debugging Demo

This demo showcases **GitHub Copilot's ability to analyze application logs** and help debug issues in a realistic "toy store" order processing system.

## 📁 Project Structure

```
contoso-toyland/
├── data/
│   └── orders.csv          # Order data with hidden "poison" records
├── python/
│   └── processor.py        # Python order processor
├── node/
│   └── processor.js        # Node.js order processor
├── logs/
│   ├── python.log          # Generated after running Python processor
│   └── node.log            # Generated after running Node processor
└── README.md
```

## 🚀 Quick Start

### Run the Python Processor
```bash
python3 python/processor.py
```

### Run the Node.js Processor
```bash
node node/processor.js
```

### Run Both (Quick Setup)
```bash
./run-demo.sh
```

Both processors will read from `data/orders.csv` and generate verbose logs in the `logs/` directory.

---

## 🎯 Demo Script

### The Scenario
It's the **Holiday Rush** at Contoso Toyland! The order processing system is experiencing intermittent failures. Your job is to use **GitHub Copilot** to analyze the logs, find the bugs, and fix them.

### Hidden Issues in the Data
The `orders.csv` file contains **3 problematic orders**:
- **CT-1004**: Has `string_error` instead of a numeric price
- **CT-1006**: Has `0` quantity (edge case)
- **CT-1008**: Has `-1` quantity (negative value)

---

## 📋 Copilot Demo Prompts

### 🔍 Scenario 1: Analyze Logs (The "Needle in Haystack")

**Setup**: Run the processor, then open `logs/python.log` or `logs/node.log`

**Action**: Select the entire log file content (Ctrl+A)

**Copilot Prompt**:
```
Analyze this log file. Summarize the errors and their root causes.
```

**Expected Copilot Response**: Identifies the different error types:
1. `TypeError: unsupported operand type(s) for +: 'float' and 'NoneType'` - Code bug!
2. `ValueError: could not convert string to float` - Data issue
3. `Cannot read properties of undefined` - Null reference error

---

### 🐛 Scenario 2: Debug a TypeError (Code Error!)

**Setup**: In `logs/python.log`, find and select the `TypeError` error block

**Action**: Highlight this specific error:
```
TypeError: unsupported operand type(s) for +: 'float' and 'NoneType'
```

**Copilot Prompt**:
```
@workspace This TypeError is crashing all orders. Find the line of code causing this and explain why it happens.
```

**Expected Copilot Response**: Points to `apply_holiday_discount()` function where `discount_rate = base_rate + tier_discount` fails because `get_discount_tier()` returns `None`.

---

### 🔧 Scenario 3: Fix the None Type Bug

**Setup**: Open `python/processor.py` and navigate to `get_discount_tier()` function

**Copilot Prompt**:
```
Fix get_discount_tier to return a default value instead of None, and update apply_holiday_discount to handle edge cases safely.
```

**Expected Copilot Response**: Suggests adding `return tiers.get(category, 0.0)` or adding a None check.

---

### 💥 Scenario 4: Debug Undefined Property Access (Node.js)

**Setup**: In `logs/node.log`, find the error:
```
Cannot read properties of undefined (reading 'toUpperCase')
```

**Copilot Prompt**:
```
@workspace Why does this error occur? Which line causes it and for which orders?
```

**Expected Copilot Response**: Identifies that `getBonusRate()` assumes `parts[1]` exists after splitting product_id.

---

### 🎯 Scenario 5: Find All Bugs in a Function

**Setup**: Open `node/processor.js`, select the `applyHolidayDiscount` function

**Copilot Prompt**:
```
Review this function for bugs. List every potential issue including null references, race conditions, and edge cases.
```

**Expected Copilot Response**: Identifies:
1. `discountConfig` can be null (race condition)
2. `getBonusRate` has array index out of bounds
3. `getLoyaltyBonus` has off-by-one error
4. No discount cap (could exceed 100%)

---

### 🔄 Scenario 6: Compare Error Handling

**Setup**: Open both `python/processor.py` and `node/processor.js`

**Copilot Prompt**:
```
@workspace Compare how these two files handle the same bugs. Which implementation fails more gracefully?
```

---

### 🛠️ Scenario 7: Generate Unit Tests

**Setup**: Open `python/processor.py`

**Copilot Prompt**:
```
Generate pytest unit tests that would catch these bugs: None return values, empty strings, and zero values.
```

---

### 📊 Scenario 8: Root Cause Analysis Report

**Setup**: Select error logs from both Python and Node.js

**Copilot Prompt**:
```
Generate a root cause analysis report categorizing bugs as:
1. Code defects (logic errors)
2. Data validation gaps  
3. Missing null checks
Include severity and fix priority.
```

**Copilot Prompt**:
```
Generate a bug report for the engineering team based on these errors. 
Include severity, affected orders, and recommended fixes.
```

---

## 🎓 Key Takeaways for the Audience

1. **Copilot can parse verbose logs** and extract meaningful insights
2. **@workspace reference** lets Copilot search your entire codebase
3. **Stack traces in logs** help Copilot pinpoint exact code locations
4. **Copilot can compare** multiple implementations and suggest best practices
5. **Natural language prompts** work - no special syntax needed
6. **Code bugs vs Data bugs** - Copilot distinguishes between logic errors and bad input

---

## 💡 Tips for Presenters

- **Start with messy logs**: Show the "noise" before asking Copilot to filter
- **Use incremental prompts**: Start broad ("what's wrong?") then get specific ("fix line 55")
- **Show the fix working**: Re-run the processor after Copilot's fix to prove it works
- **Highlight @workspace**: This is the magic that connects logs to code
- **Show TypeError first**: Code bugs are more impressive than data validation errors

---

## 🐛 Intentional Bugs (Spoilers!)

### Code Bugs (Logic Errors)
| File | Function | Bug | Error Type |
|------|----------|-----|------------|
| `processor.py` | `get_discount_tier()` | Returns `None` for unknown categories | `TypeError` |
| `processor.py` | `apply_holiday_discount()` | Adds `None` to float | `TypeError` |
| `processor.js` | `loadDiscountConfig()` | Race condition - config sometimes null | `TypeError` |
| `processor.js` | `getBonusRate()` | Array index out of bounds | `TypeError` |
| `processor.js` | `getLoyaltyBonus()` | Off-by-one error accessing array | `undefined` |

### Data Bugs (CSV Issues)
| File | Line | Bug | Effect |
|------|------|-----|--------|
| `orders.csv` | 5 | `string_error` as price | `ValueError` |
| `orders.csv` | 7 | `0` quantity | Edge case (zero total) |
| `orders.csv` | 9 | `-1` quantity | Validation error |
| `orders.csv` | 12 | `MALFORMED` product ID | Missing array element |
| `orders.csv` | 13 | Empty product ID | `undefined` access |

---

*Demo created for GitHub Copilot capabilities showcase - January 2026*

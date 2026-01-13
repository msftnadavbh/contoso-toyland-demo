#!/bin/bash
# Contoso Toyland Demo Runner
# Usage: ./run-demo.sh [--reset]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🧸 Contoso Toyland Demo Runner${NC}"
echo "=================================="

# Handle --reset flag
if [ "$1" == "--reset" ]; then
    echo -e "${YELLOW}Resetting code to original (buggy) state...${NC}"
    git checkout -- python/processor.py node/processor.js 2>/dev/null || true
    echo -e "${GREEN}✓ Code reset complete${NC}"
    echo ""
fi

# Check dependencies
echo "Checking dependencies..."

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "  ${GREEN}✓${NC} Python: $PYTHON_VERSION"
    PYTHON_OK=true
else
    echo -e "  ${RED}✗${NC} Python3 not found"
    PYTHON_OK=false
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>&1)
    echo -e "  ${GREEN}✓${NC} Node.js: $NODE_VERSION"
    NODE_OK=true
else
    echo -e "  ${RED}✗${NC} Node.js not found"
    NODE_OK=false
fi

echo ""

# Run Python processor
if [ "$PYTHON_OK" = true ]; then
    echo -e "${BLUE}Running Python processor...${NC}"
    python3 python/processor.py
    if [ -f "logs/python.log" ]; then
        PYTHON_LINES=$(wc -l < logs/python.log)
        PYTHON_ERRORS=$(grep -c "ERROR\|CRITICAL" logs/python.log 2>/dev/null || echo "0")
        echo -e "  ${GREEN}✓${NC} Generated logs/python.log ($PYTHON_LINES lines, $PYTHON_ERRORS errors)"
    fi
    echo ""
fi

# Run Node.js processor
if [ "$NODE_OK" = true ]; then
    echo -e "${BLUE}Running Node.js processor...${NC}"
    node node/processor.js
    if [ -f "logs/node.log" ]; then
        NODE_LINES=$(wc -l < logs/node.log)
        NODE_ERRORS=$(grep -c "ERROR\|CRITICAL" logs/node.log 2>/dev/null || echo "0")
        echo -e "  ${GREEN}✓${NC} Generated logs/node.log ($NODE_LINES lines, $NODE_ERRORS errors)"
    fi
    echo ""
fi

# Summary
echo "=================================="
echo -e "${GREEN}Demo Ready!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open logs/python.log in VS Code"
echo "  2. Select all (Ctrl+A) and ask Copilot:"
echo "     \"Analyze this log file. What errors are occurring?\""
echo ""
echo "See Facilitator.md for full demo script."
echo ""

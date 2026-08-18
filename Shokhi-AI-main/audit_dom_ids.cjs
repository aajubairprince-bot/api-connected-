const fs = require('fs');

const html = fs.readFileSync('f:\\downloads\\Shokhi-AI-main\\Shokhi-AI-main\\www\\index.html', 'utf8');

// Extract all IDs from HTML
const idRegex = /id=["']([^"']+)["']/g;
const allIds = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
  allIds.add(match[1]);
}

// Extract all getElementById calls
const getElRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
const accessedIds = [];
while ((match = getElRegex.exec(html)) !== null) {
  accessedIds.push(match[1]);
}

const missingIds = [];
for (const id of accessedIds) {
  if (!allIds.has(id)) {
    missingIds.push(id);
  }
}

console.log('Total HTML IDs defined:', allIds.size);
console.log('Total getElementById accesses:', accessedIds.length);
console.log('MISSING IDs referenced in JS:', [...new Set(missingIds)]);

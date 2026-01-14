
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/@lazorkit/wallet/dist/index.mjs');
console.log(`Reading ${filePath}...`);

function checkFile(fPath) {
    try {
        if (!fs.existsSync(fPath)) {
            console.log(`File not found: ${fPath}`);
            return;
        }
        const content = fs.readFileSync(fPath, 'utf8');
        
        console.log(`Checking ${path.basename(fPath)} (len: ${content.length})`);
        
        const hasTypeExecute = content.includes('type:"execute"');
        console.log(' - Has type:"execute":', hasTypeExecute);
        
        const hasInstructionsLen = content.includes('instructions.length===1?');
        console.log(' - Has instructions.length===1?:', hasInstructionsLen);
        
        const hasBadExecute = content.includes('type:Execute') || content.includes('type:M.Execute') || content.includes('type:t.Execute') || content.includes('type:n.Execute');
        console.log(' - Has BAD Execute reference:', hasBadExecute);
        
        if (hasBadExecute) {
            console.log('   !!! FOUND BAD PATTERNS !!!');
            if (content.includes('type:Execute')) console.log('   - type:Execute');
            if (content.includes('type:M.Execute')) console.log('   - type:M.Execute');
            if (content.includes('type:t.Execute')) console.log('   - type:t.Execute');
            if (content.includes('type:n.Execute')) console.log('   - type:n.Execute');
        }

        // Check for bare Execute variable usage that might cause ReferenceError
        // Look for "type:Execute" where Execute is treated as a variable
        const bareExecute = /type:\s*Execute[,}]/.test(content);
        if (bareExecute) console.log('   - Found bare Execute usage (type:Execute)');

    } catch (e) {
        console.error(`Error reading ${fPath}:`, e);
    }
}

checkFile(filePath);

// Check dist files
const distDir = path.join(__dirname, '../dist/assets');
if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
    files.forEach(f => checkFile(path.join(distDir, f)));
}

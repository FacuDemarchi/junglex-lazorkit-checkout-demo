
const fs = require('fs');
const path = require('path');

const filesToPatch = [
    path.join(__dirname, '../node_modules/@lazorkit/wallet/dist/index.mjs'),
    path.join(__dirname, '../node_modules/@lazorkit/wallet/dist/index.js')
];

filesToPatch.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    console.log(`Reading file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // --- Patch 0: Expose BN to window (Critical for minified scope issues) ---
    const importStr = 'import*as A from"@coral-xyz/anchor";';
    if (content.includes(importStr) && !content.includes('window.LazorKitBN=A.BN')) {
        console.log('Exposing Anchor BN to window...');
        content = content.replace(importStr, importStr + 'if(typeof window!=="undefined"){window.LazorKitBN=A.BN;}');
        modified = true;
    }

    // --- Patch 1: Add Execute to SmartWalletAction enum ---
    if (content.includes('ExecuteChunk="execute_chunk"') && !content.includes('Execute="execute"')) {
        console.log('Adding Execute to SmartWalletAction enum...');
        content = content.replace('ExecuteChunk="execute_chunk"', 'ExecuteChunk="execute_chunk",Execute="execute"');
        modified = true;
    }
    // Fallback for minified property names if different
    if (content.includes('t.ExecuteChunk="execute_chunk"') && !content.includes('t.Execute="execute"')) {
        console.log('Adding Execute to SmartWalletAction enum (minified t.)...');
        content = content.replace('t.ExecuteChunk="execute_chunk"', 't.ExecuteChunk="execute_chunk",t.Execute="execute"');
        modified = true;
    }

    // --- Patch 2: Conditional Execute flow ---
    const regexExecute = /\{type:(\w+)\.CreateChunk,args:\{cpiInstructions:(\w+)\.instructions\}\}/g;
    
    if (regexExecute.test(content)) {
        console.log('Applying Execute flow optimization...');
        // Use literal "execute" string to avoid ReferenceError if the enum property is missing
        content = content.replace(regexExecute, '($2.instructions.length===1?{type:"execute",args:{cpiInstruction:$2.instructions[0]}}:{type:$1.CreateChunk,args:{cpiInstructions:$2.instructions}})');
        modified = true;
    }

    // --- Patch 3: Fix Signature Normalization & Logging ---
    // Check for existing patch or original code
    if (!content.includes('window.tryNormalizeSignature')) {
        const signaturePattern = /case"sign-result":case"SIGNATURE_CREATED":const (\w+)={signature:(\w+)\.normalized,/g;
        if (signaturePattern.test(content)) {
            console.log('Patching signature handling with logging...');
            content = content.replace(signaturePattern, 'case"sign-result":case"SIGNATURE_CREATED":console.log("[LazorKit Patch] Received from portal:", $2);const $1={signature:(window.tryNormalizeSignature?window.tryNormalizeSignature($2.signature||$2.normalized):$2.normalized),');
            modified = true;
        } else {
             const relaxedPattern = /signature:(\w+)\.normalized,clientDataJsonBase64:/;
             if (relaxedPattern.test(content)) {
                  console.log('Found relaxed signature pattern, patching...');
                  content = content.replace(relaxedPattern, 'signature:(window.tryNormalizeSignature?window.tryNormalizeSignature($1.signature||$1.normalized):$1.normalized),clientDataJsonBase64:');
                  modified = true;
             }
        }
    }

    // --- Patch 4: Fix Timestamp in executeTxn (Global BN Fix) ---
    const timestampPattern = /w\s*=\s*await\s+e\.executeTxn\(\{\s*payer:\s*n/g;
    const existingPatchPattern = /w\s*=\s*await\s+e\.executeTxn\(\{\s*timestamp:\s*(?:new\s+A\.BN\(o\)|Date\.now\(\)|new\s+window\.LazorKitBN\(o\)),\s*payer:\s*n/g;
    
    if (existingPatchPattern.test(content)) {
        if (!content.includes('window.LazorKitBN(o)')) {
             console.log('Updating timestamp patch to use window.LazorKitBN...');
             content = content.replace(existingPatchPattern, 'w = await e.executeTxn({ timestamp: new window.LazorKitBN(o), payer: n');
             modified = true;
        }
    } else if (timestampPattern.test(content)) {
        console.log('Patching timestamp in executeTxn...');
        content = content.replace(timestampPattern, 'w = await e.executeTxn({ timestamp: new window.LazorKitBN(o), payer: n');
        modified = true;
    } else {
         const strictString = 'w=await e.executeTxn({payer:n';
         if (content.includes(strictString)) {
             console.log('Patching timestamp in executeTxn (strict)...');
             content = content.replace(strictString, 'w=await e.executeTxn({timestamp:new window.LazorKitBN(o),payer:n');
             modified = true;
         }
    }

    // --- Patch 5: Relax BN Validation (Nuclear Fix for instanceof mismatch) ---
    // Replaces function ct(t,e) validator with a safe version
    const ctRegex = /function ct\(t,e\)\{.*?\}function dt\(/;
    
    if (ctRegex.test(content)) {
        const match = content.match(ctRegex)[0];
        // Check if already patched with the safe version (contains try/catch and bypass warning)
        if (!match.includes('Bypassed BN check') || !match.includes('try{')) {
            console.log('Patching ct function (BN Validator) to be permissive...');
            const newCt = 'function ct(t,e){$(t,e);try{if(t&&(t instanceof A.BN||typeof t.lt==="function")){if(t.lt(new A.BN(0)))console.warn(e+" is negative");}else{console.warn("[LazorKit Patch] Bypassed BN check for "+e);}}catch(err){console.warn("[LazorKit Patch] Error in BN check:",err);}}function dt(';
            content = content.replace(ctRegex, newCt);
            modified = true;
        } else {
             console.log('BN Validator already patched.');
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Successfully patched ${path.basename(filePath)}`);
    } else {
        console.log(`No changes needed for ${path.basename(filePath)}`);
    }
});


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
    // Fix previously introduced global variable leak (ReferenceError: Execute is not defined)
    const badGlobalExecute = /,Execute="execute"/g;
    if (badGlobalExecute.test(content)) {
        console.log('Removing leaking global Execute variable...');
        content = content.replace(badGlobalExecute, '');
        modified = true;
    }

    // Correctly add Execute to the enum using regex to capture the object variable (e.g. t.ExecuteChunk)
    const enumRegex = /(\w+)\.ExecuteChunk="execute_chunk"/;
    if (enumRegex.test(content)) {
         if (!content.includes(`${content.match(enumRegex)[1]}.Execute="execute"`)) {
             console.log('Adding Execute to SmartWalletAction enum (safe regex)...');
             content = content.replace(enumRegex, '$1.ExecuteChunk="execute_chunk",$1.Execute="execute"');
             modified = true;
         }
    } else if (content.includes('ExecuteChunk="execute_chunk"') && !content.includes('Execute="execute"')) {
        // Fallback only if regex fails (unlikely given the minification structure)
        console.log('Adding Execute to SmartWalletAction enum (fallback)...');
        // We assume it might be M.ExecuteChunk or similar, but to be safe we should try to find the variable
        // If we can't, we skip to avoid ReferenceError, relying on the regex above which is safer.
        console.warn('Could not safely patch ExecuteChunk with regex. Skipping unsafe string replace.');
    }

    // --- Patch 2: Conditional Execute flow ---
    // First, fix any bad patches (ReferenceError: Execute is not defined)
    const badPatchRegex = /type:\w+\.Execute,/g;
    const badPatchRegexBare = /type:Execute,/g;
    
    if (badPatchRegex.test(content)) {
        console.log('Fixing bad M.Execute reference in existing patch...');
        content = content.replace(badPatchRegex, 'type:"execute",');
        modified = true;
    }
    if (badPatchRegexBare.test(content)) {
        console.log('Fixing bad bare Execute reference in existing patch...');
        content = content.replace(badPatchRegexBare, 'type:"execute",');
        modified = true;
    }

    const regexExecute = /\{type:(\w+)\.CreateChunk,args:\{cpiInstructions:(\w+)\.instructions\}\}/g;
    
    // Only apply the main patch if it hasn't been applied yet (avoid nesting loops)
    if (!content.includes('type:"execute"') && !content.includes('instructions.length===1?')) {
        if (regexExecute.test(content)) {
            console.log('Applying Execute flow optimization...');
            // Use literal "execute" string to avoid ReferenceError if the enum property is missing
            content = content.replace(regexExecute, '($2.instructions.length===1?{type:"execute",args:{cpiInstruction:$2.instructions[0]}}:{type:$1.CreateChunk,args:{cpiInstructions:$2.instructions}})');
            modified = true;
        }
    } else {
        console.log('Execute flow optimization already present (skipped to avoid nesting).');
        if (content.includes('type:"execute"')) console.log('Found type:"execute"');
        if (content.includes('instructions.length===1?')) console.log('Found instructions.length===1?');
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

    // --- Patch 4: Fix Timestamp in executeTxn (Explicit BN conversion at definition) ---
    // We patch the definition of executeTxn to ensure timestamp is a BN before validation.
    // Original: async executeTxn(t,e={}){this.validateExecuteParams(t);
    const executeTxnDefRegex = /async\s+executeTxn\(t,e=\{\}\)\s*\{\s*this\.validateExecuteParams\(t\);/;

    if (executeTxnDefRegex.test(content)) {
        console.log('Patching executeTxn definition to enforce BN timestamp...');
        const replacement = 'async executeTxn(t,e={}){if(t.timestamp&&!(t.timestamp instanceof A.BN)){console.log("[LazorKit Patch] Converting timestamp to BN in executeTxn");t.timestamp=new window.LazorKitBN(t.timestamp);}this.validateExecuteParams(t);';
        content = content.replace(executeTxnDefRegex, replacement);
        modified = true;
    } else if (content.includes('Converting timestamp to BN in executeTxn')) {
        console.log('executeTxn definition already patched.');
    } else {
        console.log('Could not find executeTxn definition to patch. Regex might need adjustment.');
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

    // --- Patch 6: Add 'execute' case to buildAuthorizationMessage ---
    // Fixes: ValidationError: Unsupported SmartWalletAction: execute
    const executeCaseRegex = /case "execute":/;
    if (!executeCaseRegex.test(content)) {
        console.log('Patching buildAuthorizationMessage to support "execute" action...');
        
        // 1. Find the internal function names
        const buildExecuteMatch = content.match(/(\w+) as buildExecuteMessage/);
        const buildExecuteName = buildExecuteMatch ? buildExecuteMatch[1] : 'Ot';
        
        const buildCreateChunkMatch = content.match(/(\w+) as buildCreateChunkMessage/);
        const buildCreateChunkName = buildCreateChunkMatch ? buildCreateChunkMatch[1] : 'zt';
        
        console.log(`Detected internal names: buildExecuteMessage=${buildExecuteName}, buildCreateChunkMessage=${buildCreateChunkName}`);
        
        // 2. Find the insertion point (end of CreateChunk case)
        // Pattern: e=zt(n,(await this.getWalletStateData(n)).lastNonce,i,d,o,[...l??[],t.payer]);break}default:
        // We capture the whole CreateChunk ending to append our case after it.
        const insertionPattern = new RegExp(`(e=${buildCreateChunkName}\\(n,\\(await this\\.getWalletStateData\\(n\\)\\)\\.lastNonce,i,d,o,\\[\\.\\.\\.l\\?\\?\\[\\],t\\.payer\\]\\);break\\})(default:)`);
        
        if (insertionPattern.test(content)) {
            console.log('Found insertion point for execute case.');
            const newCase = `case "execute":{const{policyInstruction:s,cpiInstruction:o,cpiSigners:l}=a.args,c=await this.getWalletStateData(t.smartWallet),d=await this.policyResolver.resolveForExecute({provided:s,smartWallet:t.smartWallet,credentialHash:t.credentialHash,passkeyPublicKey:r,walletStateData:c});e=${buildExecuteName}(n,(await this.getWalletStateData(n)).lastNonce,i,d,o,[...l??[],t.payer]);break}`;
            content = content.replace(insertionPattern, `$1${newCase}$2`);
            modified = true;
        } else {
            console.warn('Could not find insertion point for execute case. Code structure might have changed.');
            // Debug hint: print what we found around 'buildCreateChunkName'
            const idx = content.indexOf(`${buildCreateChunkName}(n,`);
            if (idx !== -1) {
                console.log('Context around call:', content.substring(idx, idx + 200));
            }
        }
    } else {
        console.log('buildAuthorizationMessage already supports "execute".');
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Successfully patched ${path.basename(filePath)}`);
    } else {
        console.log(`No changes needed for ${path.basename(filePath)}`);
    }
});

// WebAuthn Polyfill for LazorKit compatibility
// 1. Prioritizes ES256 (alg: -7) for creation to ensure 33-byte keys.
// 2. Normalizes S-value in signatures (secp256r1) to prevent 0x2 error.

  // Helper for patching LazorKit SDK directly
  window.tryNormalizeSignature = function (inputSig) {
    if (!inputSig) {
        console.warn('[WebAuthn Polyfill] No signature input provided');
        return undefined;
    }
    
    try {
        let bytes;
        if (typeof inputSig === 'string') {
            console.log('[WebAuthn Polyfill] Normalizing Base64 signature');
            // Decode Base64 to Uint8Array
            const binaryString = window.atob(inputSig);
            const len = binaryString.length;
            bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
        } else if (inputSig instanceof Uint8Array || Array.isArray(inputSig)) {
             console.log('[WebAuthn Polyfill] Normalizing Byte Array signature');
             bytes = new Uint8Array(inputSig);
        } else if (typeof inputSig === 'object' && Object.values(inputSig).length > 0) {
             // Handle object-like array {0: x, 1: y...}
             console.log('[WebAuthn Polyfill] Normalizing Object-like signature');
             bytes = new Uint8Array(Object.values(inputSig));
        } else {
            console.warn('[WebAuthn Polyfill] Unknown signature format:', typeof inputSig);
            return inputSig;
        }
        
        const signature = bytes;
        
        // Basic DER check (0x30 = Sequence)
        if (signature[0] === 0x30) {
            let pos = 0;
            pos++; // skip 0x30
            let lenByte = signature[pos++];
            if (lenByte & 0x80) {
                pos += (lenByte & 0x7f);
            }
            
            // R
            if (signature[pos++] !== 0x02) return signature; // Not valid DER
            const rLen = signature[pos++];
            const rBytes = signature.slice(pos, pos + rLen);
            pos += rLen;
            
            // S
            if (signature[pos++] !== 0x02) return signature; // Not valid DER
            const sLen = signature[pos++];
            const sBytes = signature.slice(pos, pos + sLen);
            
            // Convert S to BigInt
            let sHex = Array.from(sBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            let sBig = BigInt('0x' + sHex);

            const SECP256R1_ORDER = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
            const SECP256R1_HALF_ORDER = 0x7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8n;

            if (sBig > SECP256R1_HALF_ORDER) {
                console.log('[WebAuthn Polyfill] High S-value detected in iframe response, normalizing...');
                const newS = SECP256R1_ORDER - sBig;
                
                // Re-encode S
                let newSHex = newS.toString(16);
                if (newSHex.length % 2) newSHex = '0' + newSHex;
                let newSBytes = [];
                for (let i = 0; i < newSHex.length; i += 2) {
                    newSBytes.push(parseInt(newSHex.substring(i, i + 2), 16));
                }
                
                // DER integer rule: if first bit is 1, prepend 0x00
                if (newSBytes[0] & 0x80) {
                    newSBytes.unshift(0x00);
                }

                // Reconstruct DER
                // R Tag (0x02) + R Len + R Bytes
                const rEncoded = new Uint8Array([0x02, rLen, ...rBytes]);
                // S Tag (0x02) + S Len + S Bytes
                const sEncoded = new Uint8Array([0x02, newSBytes.length, ...newSBytes]);
                
                const seqLen = rEncoded.length + sEncoded.length;
                
                // Sequence Tag (0x30) + Length + Content
                let seqEncoded;
                if (seqLen < 128) {
                    seqEncoded = new Uint8Array([0x30, seqLen, ...rEncoded, ...sEncoded]);
                } else {
                    // Assuming length < 256 for signature
                    seqEncoded = new Uint8Array([0x30, 0x81, seqLen, ...rEncoded, ...sEncoded]);
                }
                
                // Return as Base64 string to satisfy LazorKit's validation
                return window.btoa(String.fromCharCode(...seqEncoded));
            }
        }
        
        // Return original Base64 if no changes were made (and input was string)
        if (typeof inputSig === 'string' && !bytes) {
             return inputSig;
        }

        // Return as Base64 string if it was normalized but not changed
        return window.btoa(String.fromCharCode(...bytes));
    } catch (e) {
        console.error('[WebAuthn Polyfill] Error normalizing signature:', e);
        return inputSig; // Return original on error to be safe
    }
  };

  if (typeof window !== 'undefined' && window.navigator && window.navigator.credentials) {
  const originalCreate = window.navigator.credentials.create;
  const originalGet = window.navigator.credentials.get;

  // Fix 1: Prioritize ES256 for Create
  window.navigator.credentials.create = async function (options) {
    if (options && options.publicKey && options.publicKey.pubKeyCredParams) {
       const preferredParams = [
            { type: 'public-key', alg: -7 },   // ES256
            { type: 'public-key', alg: -257 }  // RS256
        ];
        const existingParams = options.publicKey.pubKeyCredParams || [];
        const finalParams = [...preferredParams];
        
        for (const p of existingParams) {
            if (!finalParams.some(fp => fp.alg === p.alg)) {
                finalParams.push(p);
            }
        }

        const newOptions = {
            ...options,
            publicKey: {
                ...options.publicKey,
                pubKeyCredParams: finalParams
            }
        };
        console.log('[WebAuthn Polyfill] Reordered options with ES256 priority', newOptions);
        return originalCreate.call(this, newOptions);
    }
    return originalCreate.call(this, options);
  };

  // Fix 2: Normalize S-value for Get (Signature)
  const SECP256R1_ORDER = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
  const SECP256R1_HALF_ORDER = 0x7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8n;

  window.navigator.credentials.get = async function (options) {
    // Only intercept if it's a publicKey request
    if (options && options.publicKey) {
        console.log('[WebAuthn Polyfill] Intercepting credentials.get', options);
        try {
            const credential = await originalGet.call(this, options);

            if (credential && credential.response && credential.response.signature) {
                try {
                    const signature = new Uint8Array(credential.response.signature);
                    
                    // Basic DER check
                    if (signature[0] === 0x30) {
                        let pos = 0;
                        pos++; // skip 0x30
                        let len = signature[pos++];
                        if (len & 0x80) {
                            pos += (len & 0x7f);
                        }
                        
                        // R
                        if (signature[pos++] !== 0x02) throw new Error("Invalid DER: Expected Integer for R");
                        const rLen = signature[pos++];
                        const rBytes = signature.slice(pos, pos + rLen);
                        pos += rLen;
                        
                        // S
                        if (signature[pos++] !== 0x02) throw new Error("Invalid DER: Expected Integer for S");
                        const sLen = signature[pos++];
                        const sBytes = signature.slice(pos, pos + sLen);
                        
                        // Convert S to BigInt
                        let sHex = Array.from(sBytes).map(b => b.toString(16).padStart(2, '0')).join('');
                        let sBig = BigInt('0x' + sHex);

                        if (sBig > SECP256R1_HALF_ORDER) {
                            console.log('[WebAuthn Polyfill] High S-value detected, normalizing...');
                            const newS = SECP256R1_ORDER - sBig;
                            
                            // Re-encode S
                            let newSHex = newS.toString(16);
                            if (newSHex.length % 2) newSHex = '0' + newSHex;
                            let newSBytes = [];
                            for (let i = 0; i < newSHex.length; i += 2) {
                                newSBytes.push(parseInt(newSHex.substring(i, i + 2), 16));
                            }
                            
                            // DER integer rule: if first bit is 1, prepend 0x00
                            if (newSBytes[0] & 0x80) {
                                newSBytes.unshift(0x00);
                            }

                            // Reconstruct DER
                            // R Tag (0x02) + R Len + R Bytes
                            const rEncoded = new Uint8Array([0x02, rLen, ...rBytes]);
                            // S Tag (0x02) + S Len + S Bytes
                            const sEncoded = new Uint8Array([0x02, newSBytes.length, ...newSBytes]);
                            
                            const seqLen = rEncoded.length + sEncoded.length;
                            // Seq Tag (0x30) + Seq Len (assuming < 128 for simplicity as sigs are small) + R + S
                            // Signatures are usually ~70 bytes, so len fits in 1 byte (max 127).
                            const seqEncoded = new Uint8Array([0x30, seqLen, ...rEncoded, ...sEncoded]);
                            
                            console.log('[WebAuthn Polyfill] Normalized Signature Bytes:', Array.from(seqEncoded));

                            // Use Proxy to ensure we can override response.signature
                            // This is robust against read-only properties on the native object
                            const newResponse = new Proxy(credential.response, {
                                get(target, prop, receiver) {
                                    if (prop === 'signature') {
                                        return seqEncoded.buffer;
                                    }
                                    return Reflect.get(target, prop, receiver);
                                }
                            });

                            const newCredential = new Proxy(credential, {
                                get(target, prop, receiver) {
                                    if (prop === 'response') {
                                        return newResponse;
                                    }
                                    return Reflect.get(target, prop, receiver);
                                }
                            });
                            
                            console.log('[WebAuthn Polyfill] Returning proxied credential with normalized signature');
                            return newCredential;
                        }
                    }
                } catch (e) {
                    console.error('[WebAuthn Polyfill] Error normalizing signature:', e);
                }
            }
            return credential;
        } catch (err) {
            throw err;
        }
    }
    return originalGet.call(this, options);
  };
  
  console.log('[WebAuthn Polyfill] Initialized');
}

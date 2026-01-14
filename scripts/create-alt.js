
const { Connection, Keypair, PublicKey, AddressLookupTableProgram, Transaction, sendAndConfirmTransaction, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_INSTRUCTIONS_PUBKEY } = require('@solana/web3.js');

const rpcUrl = 'https://api.devnet.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

// Fallback strings if constants are undefined
const clock = SYSVAR_CLOCK_PUBKEY || new PublicKey('SysvarC1ock11111111111111111111111111111111');
const rent = SYSVAR_RENT_PUBKEY || new PublicKey('SysvarRent11111111111111111111111111111111');
// Instructions sysvar might be: Sysvar1nstructions1111111111111111111111111
const instructionsSysvar = SYSVAR_INSTRUCTIONS_PUBKEY || new PublicKey('Sysvar1nstructions1111111111111111111111111');

// Common addresses to include in ALT
const addresses = [
    SystemProgram.programId,
    instructionsSysvar,
    clock,
    rent,
    new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), // Associated Token Program
];

async function main() {
    // 1. Setup Payer
    const payer = Keypair.generate();
    console.log('Payer:', payer.publicKey.toString());
    
    console.log('Requesting airdrop...');
    const sig = await connection.requestAirdrop(payer.publicKey, 1000000000); // 1 SOL
    await connection.confirmTransaction(sig);
    console.log('Airdrop confirmed.');

    // 2. Create ALT
    const [createInst, tableAddress] = AddressLookupTableProgram.createLookupTable({
        authority: payer.publicKey,
        payer: payer.publicKey,
        recentSlot: await connection.getSlot(),
    });

    console.log('Creating ALT...');
    
    const createTx = new Transaction().add(createInst);
    await sendAndConfirmTransaction(connection, createTx, [payer]);
    console.log('ALT Created at:', tableAddress.toString()); 
    
    // 3. Extend ALT
    console.log('Extending ALT with addresses...');
    const extendInst = AddressLookupTableProgram.extendLookupTable({
        payer: payer.publicKey,
        authority: payer.publicKey,
        lookupTable: tableAddress,
        addresses: addresses,
    });

    const extendTx = new Transaction().add(extendInst);
    await sendAndConfirmTransaction(connection, extendTx, [payer]);
    
    console.log('ALT Extended successfully.');
    console.log('-------------------------------------------');
    console.log('ALT ADDRESS:', tableAddress.toString());
    console.log('-------------------------------------------');
}

main().catch(console.error);

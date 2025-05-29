
/// Module: flashg
module flashg::flashg {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::event;
    use std::vector;

    // Errors
    const EInsufficientBalance: u64 = 0;
    const EInvalidAmount: u64 = 1;
    const ENotAuthorized: u64 = 2;

    // Grant Pool struct to manage the token distribution
    public struct GrantPool has key {
        id: UID,
        admin: address,
        total_funds: u64,
        distributed_funds: u64,
    }

    // Grant Request struct
    public struct GrantRequest has key, store {
        id: UID,
        recipient: address,
        amount: u64,
        description: vector<u8>,
        approved: bool,
    }

    // Events
    public struct GrantDistributed has copy, drop {
        recipient: address,
        amount: u64,
        distributor: address,
    }

    public struct GrantPoolCreated has copy, drop {
        pool_id: address,
        admin: address,
        initial_funds: u64,
    }

    // Initialize the grant pool
    public entry fun create_grant_pool(
        initial_funds: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let admin = tx_context::sender(ctx);
        let amount = coin::value(&initial_funds);
        
        let pool = GrantPool {
            id: object::new(ctx),
            admin,
            total_funds: amount,
            distributed_funds: 0,
        };

        let pool_address = object::uid_to_address(&pool.id);
        
        // Transfer the initial funds to the pool
        transfer::public_transfer(initial_funds, pool_address);
        
        event::emit(GrantPoolCreated {
            pool_id: pool_address,
            admin,
            initial_funds: amount,
        });

        transfer::share_object(pool);
    }

    // Add funds to the grant pool
    public entry fun add_funds_to_pool(
        pool: &mut GrantPool,
        funds: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.admin, ENotAuthorized);
        
        let amount = coin::value(&funds);
        pool.total_funds = pool.total_funds + amount;
        
        // Transfer funds to the pool
        let pool_address = object::uid_to_address(&pool.id);
        transfer::public_transfer(funds, pool_address);
    }

    // Execute grant distribution
    public entry fun execute_grant(
        pool: &mut GrantPool,
        recipient: address,
        amount: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate amount
        assert!(amount > 0, EInvalidAmount);
        
        // Check if sender has enough balance
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= amount, EInsufficientBalance);
        
        // Split the exact amount needed
        let grant_coin = if (payment_amount == amount) {
            payment
        } else {
            let grant_coin = coin::split(&payment, amount, ctx);
            // Return excess to sender
            transfer::public_transfer(payment, sender);
            grant_coin
        };
        
        // Transfer grant to recipient
        transfer::public_transfer(grant_coin, recipient);
        
        // Update pool statistics if this is from pool funds
        if (sender == pool.admin) {
            pool.distributed_funds = pool.distributed_funds + amount;
        };
        
        // Emit event
        event::emit(GrantDistributed {
            recipient,
            amount,
            distributor: sender,
        });
    }

    // Direct token transfer (for non-pool distributions)
    public entry fun send_tokens(
        recipient: address,
        amount: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate amount
        assert!(amount > 0, EInvalidAmount);
        
        // Check if sender has enough balance
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= amount, EInsufficientBalance);
        
        // Split the exact amount needed
        let transfer_coin = if (payment_amount == amount) {
            payment
        } else {
            let transfer_coin = coin::split(&mut payment, amount, ctx);
            // Return excess to sender
            transfer::public_transfer(payment, sender);
            transfer_coin
        };
        
        // Transfer tokens to recipient
        transfer::public_transfer(transfer_coin, recipient);
        
        // Emit event
        event::emit(GrantDistributed {
            recipient,
            amount,
            distributor: sender,
        });
    }

    // View functions
    public fun get_pool_info(pool: &GrantPool): (address, u64, u64) {
        (pool.admin, pool.total_funds, pool.distributed_funds)
    }

    public fun get_available_funds(pool: &GrantPool): u64 {
        pool.total_funds - pool.distributed_funds
    }

    // Create a grant request (for approval workflow)
    public entry fun create_grant_request(
        recipient: address,
        amount: u64,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        let request = GrantRequest {
            id: object::new(ctx),
            recipient,
            amount,
            description,
            approved: false,
        };
        
        transfer::transfer(request, tx_context::sender(ctx));
    }

    // Approve and execute grant request
    public entry fun approve_and_execute_grant(
        pool: &mut GrantPool,
        request: GrantRequest,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.admin, ENotAuthorized);
        
        let GrantRequest { 
            id, 
            recipient, 
            amount, 
            description: _, 
            approved: _ 
        } = request;
        
        object::delete(id);
        
        execute_grant(pool, recipient, amount, payment, ctx);
    }
}


// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions



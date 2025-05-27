
/// Module: flash
/// 
module flash::flash {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use std::string::{Self, String};
    //use std::vector;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};

    // ======== Error Codes ========
    const ETeamNotFound: u64 = 1;
    const EInsufficientAmount: u64 = 2;
    
    // ======== Structs ========
    
    /// Main platform object that holds all teams and configuration
    public struct Platform has key {
        id: UID,
        teams: Table<ID, Team>,
        platform_fee_rate: u64, // in basis points (100 = 1%)
        platform_balance: Balance<SUI>,
        admin: address,
    }

    /// Individual team information
    public struct Team has key, store {
        id: UID,
        name: String,
        description: String,
        wallet_address: address,
        total_tips_received: u64,
        tip_count: u64,
        created_at: u64,
        is_active: bool,
    }

    /// Capability object for team management
    public struct TeamCap has key, store {
        id: UID,
        team_id: ID,
    }

    /// Admin capability
    public struct AdminCap has key {
        id: UID,
    }

    // ======== Events ========
    
    public struct TeamRegistered has copy, drop {
        team_id: ID,
        name: String,
        wallet_address: address,
        timestamp: u64,
    }

    public struct TipSent has copy, drop {
        team_id: ID,
        team_name: String,
        tipper: address,
        amount: u64,
        platform_fee: u64,
        timestamp: u64,
    }

    public struct TeamUpdated has copy, drop {
        team_id: ID,
        name: String,
        description: String,
        timestamp: u64,
    }

    // ======== Init Function ========
    
    fun init(ctx: &mut TxContext) {
        let platform = Platform {
            id: object::new(ctx),
            teams: table::new(ctx),
            platform_fee_rate: 250, // 2.5% default fee
            platform_balance: balance::zero(),
            admin: tx_context::sender(ctx),
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        transfer::share_object(platform);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ======== Public Functions ========
    
    /// Register a new team
    public entry fun register_team(
        platform: &mut Platform,
        name: vector<u8>,
        description: vector<u8>,
        wallet_address: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let team_id = object::new(ctx);
        let team_uid = object::uid_to_inner(&team_id);
        
        let team = Team {
            id: team_id,
            name: string::utf8(name),
            description: string::utf8(description),
            wallet_address,
            total_tips_received: 0,
            tip_count: 0,
            created_at: clock::timestamp_ms(clock),
            is_active: true,
        };

        let team_cap = TeamCap {
            id: object::new(ctx),
            team_id: team_uid,
        };

        // Emit event
        event::emit(TeamRegistered {
            team_id: team_uid,
            name: string::utf8(name),
            wallet_address,
            timestamp: clock::timestamp_ms(clock),
        });

        table::add(&mut platform.teams, team_uid, team);
        transfer::transfer(team_cap, tx_context::sender(ctx));
    }

    /// Send a tip to a team
    public entry fun send_tip(
        platform: &mut Platform,
        team_id: ID,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&platform.teams, team_id), ETeamNotFound);
        
        let tip_amount = coin::value(&payment);
        assert!(tip_amount > 0, EInsufficientAmount);

        let team = table::borrow_mut(&mut platform.teams, team_id);
        assert!(team.is_active, ETeamNotFound);

        // Calculate platform fee
        let platform_fee = (tip_amount * platform.platform_fee_rate) / 10000;
        let team_amount = tip_amount - platform_fee;

        // Split the payment
        let platform_coin = coin::split(&mut payment, platform_fee, ctx);
        let team_coin = payment; // Remaining amount goes to team

        // Update team stats
        team.total_tips_received = team.total_tips_received + team_amount;
        team.tip_count = team.tip_count + 1;

        // Transfer to platform balance and team
        coin::put(&mut platform.platform_balance, platform_coin);
        transfer::public_transfer(team_coin, team.wallet_address);

        // Emit event
        event::emit(TipSent {
            team_id,
            team_name: team.name,
            tipper: tx_context::sender(ctx),
            amount: team_amount,
            platform_fee,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Update team information (only by team owner)
    public entry fun update_team(
        platform: &mut Platform,
        team_cap: &TeamCap,
        name: vector<u8>,
        description: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&platform.teams, team_cap.team_id), ETeamNotFound);
        
        let team = table::borrow_mut(&mut platform.teams, team_cap.team_id);
        team.name = string::utf8(name);
        team.description = string::utf8(description);

        event::emit(TeamUpdated {
            team_id: team_cap.team_id,
            name: string::utf8(name),
            description: string::utf8(description),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Deactivate a team (only by team owner)
    public entry fun deactivate_team(
        platform: &mut Platform,
        team_cap: &TeamCap,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&platform.teams, team_cap.team_id), ETeamNotFound);
        
        let team = table::borrow_mut(&mut platform.teams, team_cap.team_id);
        team.is_active = false;
    }

    // ======== Admin Functions ========
    
    /// Update platform fee (only admin)
    public entry fun update_platform_fee(
        platform: &mut Platform,
        _admin_cap: &AdminCap,
        new_fee_rate: u64,
        _ctx: &mut TxContext
    ) {
        platform.platform_fee_rate = new_fee_rate;
    }

    /// Withdraw platform fees (only admin)
    public entry fun withdraw_platform_fees(
        platform: &mut Platform,
        _admin_cap: &AdminCap,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let withdrawn = coin::take(&mut platform.platform_balance, amount, ctx);
        transfer::public_transfer(withdrawn, tx_context::sender(ctx));
    }

    // ======== View Functions ========
    
    /// Get team information
    public fun get_team_info(platform: &Platform, team_id: ID): (String, String, address, u64, u64, bool) {
        assert!(table::contains(&platform.teams, team_id), ETeamNotFound);
        let team = table::borrow(&platform.teams, team_id);
        (
            team.name,
            team.description,
            team.wallet_address,
            team.total_tips_received,
            team.tip_count,
            team.is_active
        )
    }

    /// Get platform fee rate
    public fun get_platform_fee_rate(platform: &Platform): u64 {
        platform.platform_fee_rate
    }

    /// Get platform balance
    public fun get_platform_balance(platform: &Platform): u64 {
        balance::value(&platform.platform_balance)
    }

    // ======== Test Functions ========
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions



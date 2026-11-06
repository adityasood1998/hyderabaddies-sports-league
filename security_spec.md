# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Authentication & Email Verification Invariant**: Every read and write operation requires a signed-in user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
2. **Path Variable Hardening Invariant**: Every single-document target path parameter (`{leagueId}`, `{playerId}`, `{matchId}`, `{forfeitId}`, `{adminId}`) must match `^[a-zA-Z0-9_\-]+$` with length between 1 and 128 (`isValidId()`). `isValidId()` is never used on `list` operations.
3. **Master Gate & Relational Ownership Invariant**:
   - A `Player`, `Match`, or `Forfeit` cannot be created unless its referenced `leagueId` exists in `/leagues/$(incoming().leagueId)` and belongs to `request.auth.uid`.
   - A `Match` cannot be created unless both `playerOneId` and `playerTwoId` exist in `/players/` and `playerOneId != playerTwoId`.
   - A `Forfeit` cannot be created unless `assignedToPlayerId` exists in `/players/`.
4. **Anti-Update-Gap & Schema Blueprint Invariant**:
   - Every `create` and `update` operation must invoke `isValidLeague(incoming())`, `isValidPlayer(incoming())`, `isValidMatch(incoming())`, or `isValidForfeit(incoming())`.
   - Every validation helper enforces exact key sets using `data.keys().hasAll([...]) && data.keys().hasOnly([...])` to block shadow fields.
   - Every string field has explicit `.size() >= min && .size() <= max` bounds.
5. **Temporal & Immutable Identity Invariant**:
   - On `create`, `createdAt == request.time` and `updatedAt == request.time`.
   - On `update`, `ownerId`, `leagueId` (where applicable), and `createdAt` are strictly immutable (`incoming().field == existing().field`), and `updatedAt == request.time`.
6. **Terminal State Locking Invariant**:
   - Once a `League` reaches `status == 'archived'`, a `Match` reaches `status == 'completed'`, or a `Forfeit` reaches `status == 'completed'`, non-admin updates are permanently locked.
7. **Secure List Queries Invariant**:
   - Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid` with zero `get()` or `exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on League Create)**: Authenticated user `user_A` attempts to create `/leagues/league_1` with `ownerId: "user_B"`.
2. **Payload 2 (Unverified Email Spoofing Admin)**: User with `email: "adityasood1998@gmail.com"` but `email_verified: false` attempts to read or write `/leagues/league_1`.
3. **Payload 3 (Shadow Field Injection on Player Create)**: User attempts to create `/players/player_1` with all required fields plus `"isSuperAdmin": true`.
4. **Payload 4 (Orphaned Player Without Parent League)**: User attempts to create `/players/player_1` referencing `leagueId: "non_existent_league"`.
5. **Payload 5 (Denial-of-Wallet String Overflow)**: User attempts to create `/leagues/league_1` with a `name` of 5,000 characters.
6. **Payload 6 (Path Poisoning via Invalid Document ID)**: User attempts to create `/leagues/bad$id!@#` with invalid characters in the path ID.
7. **Payload 7 (Client Timestamp Forgery)**: User attempts to create `/matches/match_1` with a backdated `createdAt` timestamp instead of `request.time`.
8. **Payload 8 (Terminal State Reversal on Completed Match)**: User attempts to update `/matches/match_completed` from `status: "completed"` back to `status: "scheduled"` or alter `scoreOne`.
9. **Payload 9 (Value Poisoning on Whitelisted Update Key)**: User attempts to update `elo` on `/players/player_1` with a string `"999999"` or negative number `-500`.
10. **Payload 10 (Immutable Ownership Transfer on Update)**: User attempts to update `/players/player_1` changing `ownerId` or `leagueId` to another value.
11. **Payload 11 (Self-Play Match Injection)**: User attempts to create `/matches/match_1` where `playerOneId == playerTwoId`.
12. **Payload 12 (Cross-Tenant List Scraping)**: User `user_B` attempts a `list` query on `/matches` without filtering `where('ownerId', '==', 'user_B')`.

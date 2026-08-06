# Firestore Security Rules Specification & Verification

## 1. Data Invariants

1. **User Identity Invariant**: Each user document in `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId`.
2. **Resource Ownership Invariant**: Trading positions (`/positions/{positionId}`), orders (`/orders/{orderId}`), and trade history items (`/tradeHistory/{historyId}`) MUST have `userId == request.auth.uid`. No user can create, update, or read records belonging to another user.
3. **Data Integrity & Schema Bounds**:
   - `pairSymbol` string length <= 20
   - `txHash` string length <= 128
   - Numeric values (`leverage`, `marginUsdt`, `amount`, `price`, `entryPrice`, `closePrice`, etc.) must be numbers.
   - Enums (`side` in ["long", "short"], `marginMode` in ["isolated", "cross"], `mode` in ["real", "demo"], `status` in ["open", "filled", "canceled"]) must strictly match allowed values.
4. **List Query Enforcer**: List queries must be constrained by `userId == request.auth.uid` on `resource.data` to prevent unauthorized query scraping.

## 2. The "Dirty Dozen" Security Payloads

1. **Unauthenticated Read/Write**: Request without auth token trying to create user or position -> DENIED.
2. **User ID Spoofing on Create**: Authenticated User A attempting to create a position with `userId = "UserB"` -> DENIED.
3. **Cross-User Position Tampering**: Authenticated User A attempting to update or delete User B's position -> DENIED.
4. **Ghost Field Injection (Shadow Update)**: Position update payload contains unauthorized extra field `isSystemAdmin: true` -> DENIED.
5. **Value Poisoning (Type Mismatch)**: Position create payload sends `leverage: "100x_string"` instead of a number -> DENIED.
6. **Oversized String Injection**: Order create payload sends `txHash` exceeding 128 chars or `pairSymbol` exceeding 20 chars -> DENIED.
7. **Enum Violation**: Position create payload sends `side: "super_long"` -> DENIED.
8. **Negative Margin Injection**: Position create payload sends `marginUsdt: -5000` -> DENIED.
9. **PII Blanket Read**: Authenticated User A attempting to query all `/users` documents -> DENIED.
10. **Unauthorized User Profile Hijack**: Authenticated User A attempting to modify User B's `/users/{userB}` wallet balance -> DENIED.
11. **Trade History Modification**: User attempting to modify another user's closed trade history -> DENIED.
12. **Blanket Query Scraping**: List query on `/positions` without specifying `userId == request.auth.uid` -> DENIED.

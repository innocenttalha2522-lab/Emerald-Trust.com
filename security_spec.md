# Security Specification & Threat Model

## 1. Data Invariants
- **User Integrity**: A user can only read and update their own user profile document unless they are the verified Platform Owner (`innocenttalha2522@gmail.com`).
- **Role Protection**: Users cannot escalate their own role from `client` to `owner` or `admin`.
- **Deposit Invariant**: Normal users can create a deposit request referencing their own identity with initial status `pending`. Only the Owner can approve or reject deposits.
- **Withdrawal Invariant**: Normal users can create a withdrawal request with status `pending`. Only the Owner can approve (dispatched) or reject (refunded) withdrawals.
- **Audit & Workspace Syncs**: Workspace synchronization records belong to the authenticating user or Owner.

## 2. The Dirty Dozen Payloads & Test Cases
1. **Payload 1 (Privilege Escalation)**: Client writes `{ role: "owner" }` to their profile. **Result: DENIED**.
2. **Payload 2 (Balance Inflation)**: Client attempts direct update of `balance: 9999999`. **Result: DENIED** (Owner only).
3. **Payload 3 (Spoofed Deposit Approval)**: Client updates their own deposit `{ status: "approved" }`. **Result: DENIED**.
4. **Payload 4 (Ghost Field Poisoning)**: Write containing oversized metadata (`notes: 50KB`). **Result: DENIED** (`.size() <= 500`).
5. **Payload 5 (Unauthenticated Write)**: Unauthenticated visitor attempts to list all deposits. **Result: DENIED**.
6. **Payload 6 (Other User's PII Access)**: Client A attempts direct `get` on Client B's private profile. **Result: DENIED**.
7. **Payload 7 (Path Injection Attack)**: Document ID containing non-alphanumeric special characters. **Result: DENIED** (`isValidId()`).
8. **Payload 8 (Spoofed Withdrawal Approval)**: Client sets `status: "approved"` on withdrawal. **Result: DENIED**.
9. **Payload 9 (Cross-User Withdrawal Creation)**: Client A submits a withdrawal with `userId: "client-B-uid"`. **Result: DENIED**.
10. **Payload 10 (Direct Deletion of Ledger Entries)**: Client attempts to delete historical approved deposit/withdrawal. **Result: DENIED**.
11. **Payload 11 (Malformed Enum Injection)**: Deposit status set to `"hacked_status"`. **Result: DENIED**.
12. **Payload 12 (Client-Side Query Enforcer Bypass)**: Client attempts unconstrained blanket list without user filter. **Result: DENIED**.

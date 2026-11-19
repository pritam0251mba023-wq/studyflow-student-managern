# STUDYFLOW Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership**: Every assignment belongs to exactly one authenticated, email-verified user (`ownerId == request.auth.uid`). No user can read, list, update, or delete another user's assignments or profile.
2. **No Shadow Fields**: Both `users/{userId}` and `assignments/{assignmentId}` enforce strict field allowlists (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly(...)` on update).
3. **Immutable Provenance**: `ownerId` (or `uid`) and `createdAt` can never be changed after creation.
4. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on every update.
5. **Bounded Types & Enum Integrity**: Every string is size-bounded; `dueDate` matches `YYYY-MM-DD`; `status` is strictly one of `Pending | In Progress | Completed`; `priority` is strictly one of `Low | Medium | High`.
6. **Path Variable Hardening**: All single-document operations validate `isValidId(docId)`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: Anonymous caller attempts to read or create `/assignments/a1`. -> `PERMISSION_DENIED`
2. **Unverified Email Spoof**: Signed-in user with `email_verified == false` attempts to create an assignment. -> `PERMISSION_DENIED`
3. **Cross-Tenant Ownership Spoof**: User A sets `ownerId: "userB"` when creating `/assignments/a2`. -> `PERMISSION_DENIED`
4. **Cross-Tenant List Scraping**: User A runs an unfiltered `collection("assignments")` query without `where("ownerId", "==", uid)`. -> `PERMISSION_DENIED`
5. **Shadow / Ghost Field Injection**: User A adds `isAdmin: true` or `gradeOverride: 100` on create or update. -> `PERMISSION_DENIED`
6. **Owner Reassignment Attack**: User A attempts to update `ownerId` on an existing assignment. -> `PERMISSION_DENIED`
7. **Immutable Timestamp Tampering**: User A attempts to alter `createdAt` during an update or backdate `createdAt` on create. -> `PERMISSION_DENIED`
8. **Invalid Enum Value**: User A submits `status: "Archived"` or `priority: "Critical"`. -> `PERMISSION_DENIED`
9. **Malformed Date Injection**: User A submits `dueDate: "tomorrow"` or `"2026/11/19"`. -> `PERMISSION_DENIED`
10. **Payload Exhaustion (Denial of Wallet)**: User A submits a 5,000-character `title` or 200-character document ID. -> `PERMISSION_DENIED`
11. **User Profile Enumeration**: User A attempts to `list` `/users` to enumerate other students. -> `PERMISSION_DENIED`
12. **Cross-User Profile Read/Write**: User A attempts to `get` or `update` `/users/userB`. -> `PERMISSION_DENIED`

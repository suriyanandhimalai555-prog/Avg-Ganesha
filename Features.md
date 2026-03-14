# What “rewards included” actually adds

Adding rewards means you now need:

| Feature | Why |
|---------|------|
| Reward rules engine | Who gets what, when |
| Reward state tracking | `pending` / `approved` / `issued` |
| Idempotency | Prevent duplicate rewards |
| Audit logs | Debug disputes and user complaints |
| Admin override | Manually fix or reverse rewards |
| Eligibility checks | Prevent self-referral abuse |
| Locking | Prevent race conditions |

> ⚠️ **Important:**  
> This is **not optional** if rewards have real value. Without these safeguards, the system will be vulnerable to abuse, duplication, and disputes.

---

## Doubts

- what to do if a person adds more than 10 person
- should their tree structure should be visible to all the users ?
- what is the diffence between the admin and superuser
- how to do the kyc

---

## Time estimation

| Task                                | Hours |
|-------------------------------------|-------|
| Planning & requirements             | 3–4   |
| UI + basic styling                  | 5–7   |
| Frontend                            | 12–15 |
| Backend (auth + referrals + levels) | 18–22 |
| Admin panel                         | 5–6   |
| Testing & bug fixes                 | 5–6   |
| Deployment                          | 2–3   |

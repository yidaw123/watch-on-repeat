# WatchOnRepeat — Internal Incident & Refund Policy
**Internal document — not for public posting**
*Last updated: July 1, 2026*

## Purpose
This document defines how WatchOnRepeat handles billing errors, service outages, and data loss affecting paying subscribers. It exists so that decisions about refunds, credits, and extensions are applied consistently, rather than improvised case-by-case. This is an internal reference, not a public-facing policy, and is not part of the Terms of Service.

## Scope
- Applies to Premium and Pro subscribers only. Free tier users are not eligible for compensation under this policy, consistent with the free tier carrying no service-level commitment.
- Third-party outages (e.g., Supabase, Lemon Squeezy, or video platform downtime) are disclosed to affected users as being caused by a third-party provider, but do not trigger compensation under this policy.

## Who Initiates the Resolution
Billing errors (double charges, charges after cancellation) and outages/data loss can be caught either way — proactively through our own monitoring, or because a user reports it first. Either path leads to the same resolution; the trigger doesn't change the outcome.

Missed cancellation is the one category that cannot be detected internally, since an active-but-unwanted subscription produces no error or log signal on our end. This category always requires the user to contact support.

## Policy Table

### Billing Issues
| Scenario | Trigger | Resolution |
|----------|---------|------------|
| Double charge or extra/erroneous charge | Detected internally or user reports | 100% refund of the erroneous charge |
| User cancelled, but was charged anyway due to our error | Detected internally or user reports | 100% refund |

### Missed Cancellation
Measured from the date the charge occurred, not the date the user contacts support. Boundary days (the 48-hour mark and the 7-day mark) count toward the more generous tier.

| Time Since Charge | Trigger | Resolution |
|-------------------|---------|------------|
| Within 48 hours | User reports | 100% refund |
| 48 hours up to and including 1 week | User reports | 50% refund |
| Beyond 1 week | User reports | No refund |

### Outages and Data Loss
Applies whether the disruption is a service outage, a lost/inaccessible feature, or data loss, as long as the cause is on WatchOnRepeat's own systems (not a third-party provider). No distinction is made between which specific feature is affected or how critical it is — duration alone determines the tier.

| Duration | Trigger | Resolution |
|----------|---------|------------|
| Under 5 hours | Detected internally or user reports | Treated as routine maintenance; no compensation. Applies equally to planned maintenance and unplanned short outages. |
| 5 hours up to 24 hours | Detected internally or user reports | Free 1-week extension |
| Over 24 hours, up to 1 week | Detected internally or user reports | Free 2-week extension |
| Over 1 week, or permanent/unrecoverable data loss | Detected internally or user reports | Free 1-month extension |

### Third-Party Outages
| Scenario | Trigger | Resolution |
|----------|---------|------------|
| Outage caused by a third-party provider (e.g., Supabase, Lemon Squeezy, or a video platform) | Detected internally | Disclose to affected users that the issue is on the partner provider's side; no compensation issued |

## Notes
- This policy intentionally avoids tiering by feature criticality (e.g., core playback vs. a peripheral feature) to keep application simple and consistent.
- Free tier users receive no compensation under any scenario in this policy.
- This document should be revisited as the business grows — particularly once there is a support team or volume of incidents large enough that the thresholds above need re-evaluation.

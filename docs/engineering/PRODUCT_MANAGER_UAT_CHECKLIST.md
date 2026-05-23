# Product Manager UAT Checklist

Use this after every feature and phase.

## General UX

- [ ] Screen title is clear.
- [ ] Purpose of screen is understandable.
- [ ] Main action is obvious.
- [ ] Empty state tells user what to do.
- [ ] Error message is human-readable.
- [ ] Success message confirms the result.
- [ ] Required fields are marked.
- [ ] Labels use business language, not database language.
- [ ] User can cancel/back out safely.
- [ ] Table filters/search are useful.

## Organization inventory fit

- [ ] Supports real hardware inventory use.
- [ ] Supports serial-number or asset-tag tracking where required.
- [ ] Supports quantity tracking where required.
- [ ] Supports location/custodian responsibility.
- [ ] Supports evidence/attachments where required.
- [ ] Supports audit trail.
- [ ] Supports reporting or future reporting.
- [ ] Handles large data lists through pagination/filtering.

## Role-specific UAT

### Admin

- [ ] Can configure master data.
- [ ] Can manage users/roles.
- [ ] Can see audit/security-relevant information.

### IT/store user

- [ ] Can add/update assets.
- [ ] Can receive/issue stock.
- [ ] Can transfer assets.
- [ ] Can upload evidence.

### Manager

- [ ] Can view dashboards/reports.
- [ ] Can approve/reject workflows.
- [ ] Can understand risk/exception items.

### Auditor

- [ ] Can verify assets.
- [ ] Can mark missing/damaged items.
- [ ] Can submit evidence.
- [ ] Can export/report audit results.

## Final PM signoff questions

- [ ] Can this feature be demoed in less than 2 minutes?
- [ ] Would a new user understand it without training?
- [ ] Does the feature reduce manual Excel work?
- [ ] Does the feature support organization accountability?
- [ ] Is the workflow complete enough for QA testing?

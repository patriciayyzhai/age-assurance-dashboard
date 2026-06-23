# Regulation Labeling Guide

This guide defines how the dashboard should analyze and label age-assurance regulations over time.

## Source hierarchy

Use sources in this order of preference:

1. Official enacted bill text, statute text, regulation text, or regulator rule text.
2. Official regulator guidance or enforcement materials.
3. Official government explainers or parliamentary bill summaries.
4. Major wire-service reporting that clearly describes a new proposal or development.

If only tier 4 is available, keep descriptions narrower and avoid turning reported policy intent into precise legal obligations.

## Threshold semantics

Do not treat every threshold as `X+`.

- Use `Under 16`, `Under 15`, `Under 14`, `Under 18`, or `Under 19` when the law protects minors below that age.
- Use `18+` only when the law explicitly requires adulthood or age 18 or older for access.
- Use `Ages 14-15` or similar when the obligation applies to a bounded band.
- Leave `threshold_age` empty when the law protects minors generally but does not state a concrete age threshold for that obligation.

## Obligation type mapping

Use the narrowest defensible label.

- `age_registration`
  Use when the law explicitly requires the user to register or declare age and the legal consequences flow from that declaration, but the source does not clearly require independent proof-of-age verification for general access.

- `age_verification`
  Use when the law explicitly requires age checks, age-gating, or equivalent proof of age.
  Do not use when the law merely mentions child safety without a user-age determination step.

- `age_estimation`
  Use when the law explicitly allows or requires estimation, inference, or risk-proportionate age assurance instead of strict verification.

- `parental_consent`
  Use only when parental or guardian consent is itself a legal condition for access, account creation, or a specified feature.

- `access_restriction`
  Use for minimum-age bans, account prohibitions, curfews, blocking minors from harmful material, or feature restrictions tied to age.

- `upstream_age_signal`
  Use for app-store, OS-level, or intermediary age labels/signals passed downstream.

- `design_restrictions`
  Use for age-appropriate design, privacy-by-design, recommender safeguards, overnight-use restrictions, or addictive-feature limits.

- `data_protection`
  Use for minors' data collection limits, profiling limits, targeted-ad restrictions, geolocation restrictions, or privacy defaults.

- `content_moderation`
  Use for duties to block, remove, label, or mitigate harmful content exposure.

- `reporting_obligation`
  Use for transparency reports, safety plans, risk assessments, audit disclosures, or recordkeeping/reporting duties.

## Description style

- Prefer one sentence per obligation.
- State the duty, then the protected class or scope.
- Avoid implying implementation details the source does not clearly require.
- Avoid saying a law "requires parental consent" if the actual law gives parents tools or override rights but does not make consent the gating rule.
- Avoid converting broad child-safety duties into hard age thresholds unless the threshold is explicit.

## Known traps

- `DSA`:
  Do not label as a general EU age-verification or parental-consent law.

- `UK Online Safety Act`:
  Do not invent a universal `13+` threshold. Distinguish child-safety duties from adult-content gating.

- `California AADC`:
  Age estimation is risk-proportionate and can be replaced by applying child protections to all users.

- `Texas SCOPE Act`:
  Distinguish age registration / known-minor duties from the separate 18+ harmful-material gate.

- `China PIPL`:
  Distinguish PIPL's under-14 data rules from separate gaming or real-name regimes.

- `News-only jurisdictions`:
  If only AP or similar reporting is available, keep labels high-level and explicitly avoid overfitting details.

# Primary-Source Audit Notes

Last updated: 2026-06-23

This note tracks which market entries have been tightened directly against primary or near-primary sources, and where we still need stronger source coverage.

## Audited

### Texas — `US-TX-HB-18`

- Source: [Texas HB 18 enrolled text](https://capitol.texas.gov/tlodocs/88R/billtext/html/HB00018F.htm)
- Confidence: high
- Key points confirmed:
  - A covered digital service may not create an account unless the user registers age.
  - Users who register as younger than 18 become `known minors`.
  - Covered providers owe data-use, parental-tools, algorithm-disclosure, and harmful-content mitigation duties to known minors.
  - A separate section requires commercially reasonable age verification for services where more than one-third of content is harmful material or obscene, and access must be denied to users who are not 18 or older.
- Modeling note:
  - Distinguish `age_registration` from true `age_verification`.
  - Distinguish known-minor protections from the separate adult-content gate.

### California — `US-CA-AB-2273`

- Source: [California AB 2273 chaptered text](https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202120220AB2273)
- Confidence: high
- Key points confirmed:
  - Children are defined as under 18.
  - Businesses must estimate age with a reasonable level of certainty appropriate to risk, or apply child protections to all users.
  - The law focuses on privacy defaults, DPIAs, profiling limits, geolocation limits, dark-pattern restrictions, and child-risk mitigation.
- Modeling note:
  - Do not describe this as a universal hard age-verification law.

### Canada — `CA-C34-2026`

- Source: [Canada Safe Social Media Act explainer](https://www.canada.ca/en/canadian-heritage/services/safe-social-media-act.html)
- Confidence: high for policy summary, medium for exact statutory phrasing
- Key points confirmed:
  - The bill would create the Digital Safety Act and Digital Safety Commission of Canada Act.
  - The bill creates a Duty to Protect Children, Digital Safety Plans, and distinct duties for social media and AI chatbot services.
  - The government intends a 16-year-old minimum age requirement for social media accounts, with possible exemptions.
- Modeling note:
  - Treat this as an official government explainer for a proposed bill, not yet a final enacted legal text.

### EU DSA — `EU-DSA-2022`

- Source: [Regulation (EU) 2022/2065](https://eur-lex.europa.eu/eli/reg/2022/2065/oj)
- Confidence: high
- Key points confirmed:
  - The DSA requires a high level of privacy, safety, and security for minors.
  - It restricts profiling-based advertising to minors when platforms are aware with reasonable certainty the recipient is a minor.
  - It requires systemic-risk assessment and mitigation for very large platforms, including risks affecting minors.
- Modeling note:
  - Do not label the DSA as a general age-verification or parental-consent law.

## Partially audited / still weak

### Utah — `US-UT-SMA-2024`

- Source currently linked: [Utah SB 152 bill page](https://le.utah.gov/~2023/bills/static/SB0152.html)
- Confidence: medium
- Current record has been kept broader because the accessible bill page is weaker for line-by-line duty extraction in this workflow.
- Follow-up need:
  - official engrossed/enrolled text or chaptered statutory text for the exact parental, curfew, messaging, and design restrictions.

### South Korea — `KR-YOUTH-2024`

- Source currently linked: [law.go.kr page](https://www.law.go.kr/lsInfoP.do?lsiSeq=253000)
- Confidence: medium
- Current record is intentionally narrow: youth-harmful media restrictions, not a general social-media minimum-age law.
- Follow-up need:
  - stronger official English-accessible text or regulator guidance for the exact online age-gating mechanism and age definition.

### Indonesia — `ID-SOCIAL-2026`

- Source currently linked: AP reporting
- Confidence: medium-low
- Current record should be treated as reporting-backed until an official regulation, ministry notice, or regulator circular is added.

### Malaysia — `MY-SOCIAL-2026`

- Source currently linked: AP reporting
- Confidence: medium-low
- Current record should be treated as reporting-backed until an official MCMC or ministry source is added.

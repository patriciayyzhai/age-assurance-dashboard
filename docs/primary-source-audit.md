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

- Sources:
  - [Utah SB 152 bill page](https://le.utah.gov/~2023/bills/static/SB0152.html)
- Confidence: medium-high on legislative existence and status, medium on precise obligation wording
- What improved:
  - the official Utah Legislature bill page clearly confirms the bill title, session history, governor signature date, and effective date.
- Remaining gap:
  - the current browsing workflow did not surface a clean text view of the enrolled provisions themselves, so duty-level wording still benefits from a direct enrolled-text or codified-statute pass.

### South Korea — `KR-YOUTH-2024`

- Sources:
  - [South Korea law.go.kr source already used in the dataset](https://www.law.go.kr/lsInfoP.do?lsiSeq=253000)
  - [Korea Media Rating Board official site](https://www.kmrb.or.kr/eng/Main.do)
- Confidence: medium
- What improved:
  - the existing `law.go.kr` source remains the most authoritative legal source in the set.
  - the KMRB official site reinforces the prevalence of `19`-based youth/adult content classification in Korean media regulation.
- Remaining gap:
  - we still need a cleaner official legal or regulator text that expressly ties online youth-harmful media access controls to account-level age-gating in language we can quote or paraphrase with confidence.

### Indonesia — `ID-SOCIAL-2026`

- Best source currently surfaced:
  - [AP report on implementation and minister statements](https://apnews.com/article/39630c776f947652cde619ad4ae56627)
- Confidence: medium-low
- What improved:
  - the AP reporting is detailed and names the ministry, the implementation date, and the platforms affected.
- Remaining gap:
  - I was not able to surface an indexed official Komdigi regulation page, ministry circular, or gazetted regulation through the current tools.
  - Until we have that, Indonesia should remain marked as reporting-backed rather than primary-source-backed.

### Malaysia — `MY-SOCIAL-2026`

- Best source currently surfaced:
  - [AP report on enforcement details](https://apnews.com/article/bfaa7b01163b61b5d53c4ecfa870d133)
- Confidence: medium-low
- What improved:
  - the AP reporting is specific on enforcement date, covered platforms, age-verification rollout, grace period, and fines.
- Remaining gap:
  - I was not able to surface an indexed official MCMC or Ministry of Communications source page through the current tools.
  - Until we have that, Malaysia should remain reporting-backed rather than primary-source-backed.

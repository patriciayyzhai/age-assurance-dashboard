// ISO 3166-1 alpha-2 → ECharts country name mapping
// ECharts uses specific country names that don't always match ISO codes

export const ISO_TO_ECHARTS: Record<string, string> = {
  AU: "Australia",
  AT: "Austria",
  BE: "Belgium",
  BR: "Brazil",
  CA: "Canada",
  CN: "China",
  DK: "Denmark",
  FR: "France",
  DE: "Germany",
  GB: "United Kingdom",
  ID: "Indonesia",
  IE: "Ireland",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  NL: "Netherlands",
  NZ: "New Zealand",
  NO: "Norway",
  PH: "Philippines",
  SG: "Singapore",
  ES: "Spain",
  SE: "Sweden",
  TR: "Turkey",
  US: "United States",
  IN: "India",
  // EU is special — we map to a high value but ECharts doesn't have an "EU" shape
  // Individual EU member states get their own scores
  FI: "Finland",
  GR: "Greece",
  PT: "Portugal",
  PL: "Poland",
  CZ: "Czech Rep.",
  RO: "Romania",
  HU: "Hungary",
  BG: "Bulgaria",
  HR: "Croatia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  SI: "Slovenia",
  SK: "Slovakia",
  LU: "Luxembourg",
  MT: "Malta",
  CY: "Cyprus",
}

export function getEchartsCountryName(isoAlpha2: string): string | undefined {
  return ISO_TO_ECHARTS[isoAlpha2]
}

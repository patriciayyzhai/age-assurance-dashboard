// ============================================================================
// Age Assurance Regulation Dashboard — Type Definitions
// ============================================================================

// --- Enums / String Literals ---

export type RegulationStatus =
  | 'proposed'
  | 'under_review'
  | 'passed'
  | 'implementation_period'
  | 'effective'
  | 'enforced'
  | 'challenged'
  | 'enjoined'
  | 'repealed';

export type ServiceTypeId =
  | 'social_media'
  | 'gaming'
  | 'ai_service'
  | 'direct_messaging'
  | 'app_store'
  | 'os_provider'
  | 'adult_content'
  | 'pornography'
  | 'online_marketplace'
  | 'streaming'
  | 'other';

export type ObligationType =
  | 'age_verification'
  | 'age_estimation'
  | 'parental_consent'
  | 'access_restriction'
  | 'upstream_age_signal'
  | 'design_restrictions'
  | 'data_protection'
  | 'content_moderation'
  | 'reporting_obligation'
  | 'other';

export type MilestoneType =
  | 'proposed'
  | 'introduced'
  | 'committee_review'
  | 'passed'
  | 'signed'
  | 'implementation_period'
  | 'effective'
  | 'enforced'
  | 'challenged'
  | 'enjoined'
  | 'repealed'
  | 'amended';

export type ActionType =
  | 'new_regulation_proposed'
  | 'existing_regulation_development'
  | 'existing_regulation_report'
  | 'not_relevant';

export type LitigationStatus =
  | 'filed'
  | 'pending'
  | 'granted'
  | 'denied'
  | 'appealed'
  | 'withdrawn'
  | 'settled';

// --- Core Entities ---

export interface Jurisdiction {
  id: string;                    // ISO 3166-1 alpha-2 (e.g., "US", "GB") or sub-national (e.g., "US-CA", "AU-NSW")
  name: string;                  // Display name (e.g., "United States", "California")
  parent_id: string | null;      // Parent jurisdiction ID for sub-nationals (e.g., "US" for "US-CA")
  iso_alpha2: string;            // ISO 3166-1 alpha-2 code for ECharts mapping
  region: string;                // Geographic region (e.g., "Europe", "Asia Pacific", "North America")
  flag_emoji?: string;
}

export interface ServiceType {
  id: ServiceTypeId;
  label: string;
  description: string;
  icon?: string;
}

export interface Obligation {
  id: string;
  regulation_id: string;
  type: ObligationType;
  description: string;
  threshold_age?: number | null;
  applies_to_service_types: ServiceTypeId[];
}

export interface Milestone {
  id: string;
  regulation_id: string;
  type: MilestoneType;
  date: string;                  // ISO 8601 date
  description: string;
  source_url?: string;
}

export interface Litigation {
  id: string;
  regulation_id: string;
  name: string;
  status: LitigationStatus;
  court?: string;
  plaintiff?: string;
  defendant?: string;
  filed_date?: string;
  description?: string;
  source_url?: string;
}

export interface Regulation {
  id: string;
  name: string;
  jurisdiction_id: string;
  summary: string;
  status: RegulationStatus;
  service_type_ids: ServiceTypeId[];
  year: number;
  source_url?: string;
  tags?: string[];
  obligations: Obligation[];
  milestones: Milestone[];
  litigations: Litigation[];
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;          // ISO 8601 datetime
  snippet?: string;
  classification: {
    action_type: ActionType;
    confidence: number;           // 0-1
    reasoning?: string;
    regulation_id?: string;       // If classified as existing_regulation_*
    proposed_regulation_name?: string;
    proposed_jurisdiction_id?: string;
    proposed_status?: RegulationStatus;
    auto_applied: boolean;        // Whether this was auto-committed
  };
  processed_at: string;           // ISO 8601 datetime
}

// --- Database File Structure ---

export interface RegulationsDatabase {
  version: string;
  last_updated: string;
  regulations: Regulation[];
}

export interface OverrideEntry {
  id: string;                     // Matches regulation ID
  _partial?: boolean;             // If true, only listed fields override
  _deleted?: boolean;             // If true, exclude from output
  [key: string]: unknown;         // Any regulation fields to override
}

export interface OverridesDatabase {
  version: string;
  last_updated: string;
  overrides: OverrideEntry[];
}

export interface SeenUrlsDatabase {
  version: string;
  last_updated: string;
  total_count: number;
  urls: Record<string, {
    url: string;
    first_seen: string;
    news_item_id?: string | null;
  }>;
}

// --- Merged Data (what the frontend consumes) ---

export interface MergedData {
  version: string;
  last_updated: string;
  regulations: Regulation[];
  news_items: NewsItem[];
  jurisdictions: Jurisdiction[];
  service_types: ServiceType[];
}

// --- Filter State ---

export interface FilterState {
  search: string;
  statuses: RegulationStatus[];
  jurisdiction_ids: string[];
  service_type_ids: ServiceTypeId[];
  obligation_types: ObligationType[];
  year_range: [number, number] | null;
}

// --- Heatmap ---

export interface CountryRiskScore {
  jurisdiction_id: string;
  country_name: string;
  iso_alpha2: string;
  risk_score: number;            // 0-100
  regulation_count: number;
  total_obligations: number;
  sub_national_breakdown?: {
    jurisdiction_id: string;
    name: string;
    risk_score: number;
    regulation_count: number;
  }[];
}

// --- Status Metadata ---

export const STATUS_META: Record<RegulationStatus, {
  label: string;
  color: string;
  weight: number;
  order: number;
}> = {
  proposed:               { label: 'Proposed',                color: '#94a3b8', weight: 10,  order: 1 },
  under_review:           { label: 'Under Review',            color: '#f59e0b', weight: 20,  order: 2 },
  challenged:             { label: 'Challenged',              color: '#a78bfa', weight: 15,  order: 3 },
  enjoined:               { label: 'Enjoined',                color: '#6366f1', weight: 5,   order: 4 },
  passed:                 { label: 'Passed',                  color: '#3b82f6', weight: 40,  order: 5 },
  implementation_period:  { label: 'Implementation Period',   color: '#06b6d4', weight: 60,  order: 6 },
  effective:              { label: 'Effective',               color: '#10b981', weight: 70,  order: 7 },
  enforced:               { label: 'Enforced',                 color: '#ef4444', weight: 100, order: 8 },
  repealed:               { label: 'Repealed',                 color: '#6b7280', weight: 0,   order: 9 },
};

export const ACTION_TYPE_META: Record<ActionType, {
  label: string;
  color: string;
  icon: string;
}> = {
  new_regulation_proposed:            { label: 'New Regulation Proposed',         color: '#ef4444', icon: '🚨' },
  existing_regulation_development:    { label: 'Existing Regulation Development', color: '#f59e0b', icon: '📈' },
  existing_regulation_report:         { label: 'Existing Regulation Report',      color: '#6b7280', icon: '📰' },
  not_relevant:                       { label: 'Not Relevant',                    color: '#d1d5db', icon: '⚪' },
};

export const SERVICE_TYPE_META: Record<ServiceTypeId, {
  label: string;
  icon: string;
}> = {
  social_media:        { label: 'Social Media',        icon: '💬' },
  gaming:              { label: 'Gaming',              icon: '🎮' },
  ai_service:          { label: 'AI Service',          icon: '🤖' },
  direct_messaging:    { label: 'Direct Messaging',    icon: '✉️' },
  app_store:           { label: 'App Store',           icon: '📱' },
  os_provider:         { label: 'OS Provider',         icon: '💻' },
  adult_content:       { label: 'Adult Content',       icon: '🔞' },
  pornography:         { label: 'Pornography',         icon: '⚠️' },
  online_marketplace:  { label: 'Online Marketplace',  icon: '🛒' },
  streaming:           { label: 'Streaming',           icon: '📺' },
  other:               { label: 'Other',               icon: '📋' },
};

export const OBLIGATION_TYPE_META: Record<ObligationType, {
  label: string;
  color: string;
}> = {
  age_verification:       { label: 'Age Verification',       color: '#ef4444' },
  age_estimation:         { label: 'Age Estimation',         color: '#f59e0b' },
  parental_consent:       { label: 'Parental Consent',       color: '#8b5cf6' },
  access_restriction:     { label: 'Access Restriction',     color: '#3b82f6' },
  upstream_age_signal:    { label: 'Upstream Age Signal',    color: '#06b6d4' },
  design_restrictions:    { label: 'Design Restrictions',    color: '#10b981' },
  data_protection:        { label: 'Data Protection',        color: '#84cc16' },
  content_moderation:     { label: 'Content Moderation',     color: '#eab308' },
  reporting_obligation:   { label: 'Reporting Obligation',   color: '#f97316' },
  other:                  { label: 'Other',                  color: '#6b7280' },
};

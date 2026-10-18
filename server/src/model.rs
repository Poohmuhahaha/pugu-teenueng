//! Wire + storage models (SOP §6.2 — Single Source of Truth with ts-rs).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct User {
    #[ts(type = "number")]
    pub id: i64,
    pub name: String,
    pub email: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    #[ts(skip)]
    pub password_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct Workspace {
    #[ts(type = "number")]
    pub id: i64,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct Membership {
    pub workspace: Workspace,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct ActorDto {
    #[ts(type = "number")]
    pub id: i64,
    pub name: String,
    pub email: String,
    #[serde(
        rename = "workspaceId",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    #[ts(rename = "workspaceId", type = "number", optional)]
    pub workspace_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct MeDto {
    pub actor: ActorDto,
    pub memberships: Vec<Membership>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub token: String,
    pub user_id: i64,
    #[serde(default)]
    pub active_workspace_id: Option<i64>,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct FieldFormat {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub number: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub bold: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub italic: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub underline: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub strike: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(type = "number", optional)]
    pub size: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(type = "number", optional)]
    pub decimals: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub align: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub wrap: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub bg: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct Field {
    pub name: String,
    #[serde(rename = "type")]
    #[ts(rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub required: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub options: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub format: Option<FieldFormat>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct ConditionalRuleMeta {
    pub id: String,
    pub range: String,
    #[serde(rename = "type")]
    #[ts(
        rename = "type",
        type = "'colorScale' | 'dataBar' | 'iconSet' | 'cellIs'"
    )]
    pub rule_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(
        type = "'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'contains'",
        optional
    )]
    pub operator: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub value1: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub value2: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub bg: Option<String>,
    #[serde(rename = "minColor", default, skip_serializing_if = "Option::is_none")]
    #[ts(rename = "minColor", optional)]
    pub min_color: Option<String>,
    #[serde(rename = "maxColor", default, skip_serializing_if = "Option::is_none")]
    #[ts(rename = "maxColor", optional)]
    pub max_color: Option<String>,
    #[serde(rename = "barColor", default, skip_serializing_if = "Option::is_none")]
    #[ts(rename = "barColor", optional)]
    pub bar_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct MergedRangeMeta {
    #[ts(type = "number")]
    pub r1: usize,
    #[ts(type = "number")]
    pub c1: usize,
    #[ts(type = "number")]
    pub r2: usize,
    #[ts(type = "number")]
    pub c2: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct SheetMeta {
    #[serde(rename = "namedRanges", default)]
    #[ts(rename = "namedRanges", type = "Record<string, string>")]
    pub named_ranges: std::collections::HashMap<String, String>,
    #[serde(rename = "conditionalRules", default)]
    #[ts(rename = "conditionalRules")]
    pub conditional_rules: Vec<ConditionalRuleMeta>,
    #[serde(rename = "mergedCells", default)]
    #[ts(rename = "mergedCells")]
    pub merged_cells: Vec<MergedRangeMeta>,
    #[serde(rename = "colWidths", default)]
    #[ts(rename = "colWidths", type = "Record<string, number>")]
    pub col_widths: std::collections::HashMap<String, usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct Schema {
    #[serde(default)]
    pub fields: Vec<Field>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub meta: Option<SheetMeta>,
}

pub fn default_kind() -> String {
    "document".into()
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct ContentType {
    #[ts(type = "number")]
    pub id: i64,
    #[serde(rename = "workspaceId")]
    #[ts(rename = "workspaceId", type = "number")]
    pub workspace_id: i64,
    pub slug: String,
    pub name: String,
    /// "document" (popup note-taker) or "spreadsheet" (full-page grid).
    #[serde(default = "default_kind")]
    pub kind: String,
    pub schema: Schema,
    #[serde(rename = "createdAt")]
    #[ts(rename = "createdAt", type = "string")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    #[ts(rename = "updatedAt", type = "string")]
    pub updated_at: DateTime<Utc>,
    #[serde(rename = "deletedAt", default, skip_serializing_if = "Option::is_none")]
    #[ts(rename = "deletedAt", type = "string | null", optional)]
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct Entry {
    #[ts(type = "number")]
    pub id: i64,
    #[serde(rename = "contentTypeId")]
    #[ts(rename = "contentTypeId", type = "number")]
    pub content_type_id: i64,
    #[ts(type = "Record<string, unknown>")]
    pub data: Map<String, Value>,
    #[serde(rename = "createdAt")]
    #[ts(rename = "createdAt", type = "string")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    #[ts(rename = "updatedAt", type = "string")]
    pub updated_at: DateTime<Utc>,
    #[serde(rename = "deletedAt", default, skip_serializing_if = "Option::is_none")]
    #[ts(rename = "deletedAt", type = "string | null", optional)]
    pub deleted_at: Option<DateTime<Utc>>,
}

/// Flattened entry as the API returns it (id + data keys + timestamps).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct EntryView {
    #[ts(type = "number")]
    pub id: i64,
    #[serde(flatten)]
    #[ts(skip)]
    pub data: Map<String, Value>,
    #[serde(rename = "createdAt")]
    #[ts(rename = "createdAt", type = "string")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    #[ts(rename = "updatedAt", type = "string")]
    pub updated_at: DateTime<Utc>,
}

impl EntryView {
    pub fn from(entry: &Entry) -> Self {
        Self {
            id: entry.id,
            data: entry.data.clone(),
            created_at: entry.created_at,
            updated_at: entry.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct Backref {
    #[ts(type = "number")]
    pub id: i64,
    #[serde(rename = "workspaceId", default)]
    #[ts(rename = "workspaceId", type = "number")]
    pub workspace_id: i64,
    #[serde(rename = "fromEntryId")]
    #[ts(rename = "fromEntryId", type = "number")]
    pub from_entry_id: i64,
    #[serde(rename = "toEntryId")]
    #[ts(rename = "toEntryId", type = "number | null")]
    pub to_entry_id: Option<i64>,
    #[serde(rename = "targetName")]
    #[ts(rename = "targetName")]
    pub target_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub alias: Option<String>,
    #[serde(default)]
    #[ts(type = "number")]
    pub offset: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub context: Option<String>,
}

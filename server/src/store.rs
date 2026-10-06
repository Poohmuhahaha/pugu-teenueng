//! In-memory store + optional JSON snapshot (mirrors huuk's approach).

use std::collections::HashMap;
use std::fs;
use std::path::Path;

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use crate::error::{ApiError, ApiResult};
use crate::model::*;

pub const SESSION_TTL_DAYS: i64 = 30;

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Store {
    pub users: Vec<User>,
    pub workspaces: Vec<Workspace>,
    pub memberships: Vec<(i64, i64, String)>, // (user_id, workspace_id, role)
    pub sessions: HashMap<String, Session>,
    pub content_types: Vec<ContentType>,
    pub entries: Vec<Entry>,
    pub backrefs: Vec<Backref>,
    next_id: i64,
}

impl Store {
    pub fn fresh() -> Self {
        Self { next_id: 1, ..Default::default() }
    }

    fn id(&mut self) -> i64 {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    /// Seed the demo workspace used by `docker compose` and local dev.
    pub fn seed() -> Self {
        let mut store = Self::fresh();
        let hash = hash_password("changeme123");
        let user_id = store.id();
        store.users.push(User {
            id: user_id,
            name: "Pooh".into(),
            email: "pooh@questpage.app".into(),
            password_hash: hash,
        });
        let ws_id = store.id();
        store.workspaces.push(Workspace { id: ws_id, name: "Pooh's Dashboard".into(), slug: "pooh-dashboard".into() });
        store.memberships.push((user_id, ws_id, "owner".into()));

        let types: [(&str, &str, &str, Vec<Field>); 4] = [
            ("areas", "Areas", "document", vec![
                Field { name: "title".into(), kind: "text".into(), required: true, options: None, format: None },
                Field { name: "description".into(), kind: "richtext".into(), required: false, options: None, format: None },
                Field { name: "icon".into(), kind: "text".into(), required: false, options: None, format: None },
            ]),
            ("projects", "Projects", "document", vec![
                Field { name: "title".into(), kind: "text".into(), required: true, options: None, format: None },
                Field { name: "status".into(), kind: "select".into(), required: false, options: Some(vec!["active".into(), "paused".into(), "done".into()]), format: None },
                Field { name: "dueDate".into(), kind: "date".into(), required: false, options: None, format: None },
            ]),
            ("tasks", "Tasks", "spreadsheet", vec![
                Field { name: "title".into(), kind: "text".into(), required: true, options: None, format: None },
                Field { name: "status".into(), kind: "select".into(), required: false, options: Some(vec!["todo".into(), "doing".into(), "done".into()]), format: None },
                Field { name: "priority".into(), kind: "select".into(), required: false, options: Some(vec!["low".into(), "med".into(), "high".into()]), format: None },
                Field { name: "estimate".into(), kind: "number".into(), required: false, options: None, format: None },
            ]),
            ("resources", "Resources", "document", vec![
                Field { name: "title".into(), kind: "text".into(), required: true, options: None, format: None },
                Field { name: "category".into(), kind: "text".into(), required: false, options: None, format: None },
                Field { name: "url".into(), kind: "text".into(), required: false, options: None, format: None },
            ]),
        ];

        for (slug, name, kind, fields) in types {
            let ct_id = store.id();
            let now = Utc::now();
            store.content_types.push(ContentType {
                id: ct_id,
                workspace_id: ws_id,
                slug: slug.into(),
                name: name.into(),
                kind: kind.into(),
                schema: Schema { fields },
                created_at: now,
                updated_at: now,
                deleted_at: None,
            });
        }

        // Sample entries (mirrors the Prisma seed).
        let areas = store.content_types.iter().find(|t| t.slug == "areas").unwrap().id;
        for (title, desc, icon) in [
            ("Health & Fitness", "Everything related to my physical and mental wellbeing. See [[Business & Career]] for work goals.", "💪"),
            ("Business & Career", "Professional growth, projects, and ventures.", "💼"),
        ] {
            let id = store.id();
            let now = Utc::now();
            let mut data = Map::new();
            data.insert("title".into(), json!(title));
            data.insert("description".into(), json!(desc));
            data.insert("icon".into(), json!(icon));
            store.entries.push(Entry { id, content_type_id: areas, data, created_at: now, updated_at: now, deleted_at: None });
        }

        // Sample spreadsheet rows (free-form keys, insertion order preserved).
        // First row = plain data labels (like a Google Sheets header row).
        let tasks = store.content_types.iter().find(|t| t.slug == "tasks").unwrap().id;
        {
            let id = store.id();
            let now = Utc::now();
            let mut data = Map::new();
            data.insert("title".into(), json!("title"));
            data.insert("status".into(), json!("status"));
            data.insert("priority".into(), json!("priority"));
            data.insert("estimate".into(), json!("estimate"));
            store.entries.push(Entry { id, content_type_id: tasks, data, created_at: now, updated_at: now, deleted_at: None });
        }
        for (title, status, priority, estimate) in [
            ("Design the component library", "doing", "high", "5"),
            ("Write release notes", "todo", "med", "2"),
            ("Ship Quest Map v2", "todo", "high", "8"),
        ] {
            let id = store.id();
            let now = Utc::now();
            let mut data = Map::new();
            data.insert("title".into(), json!(title));
            data.insert("status".into(), json!(status));
            data.insert("priority".into(), json!(priority));
            data.insert("estimate".into(), json!(estimate));
            store.entries.push(Entry { id, content_type_id: tasks, data, created_at: now, updated_at: now, deleted_at: None });
        }

        store.ensure_demo_workspace();
        let ws_ids: Vec<i64> = store.workspaces.iter().map(|w| w.id).collect();
        for id in ws_ids {
            store.rebuild_all_backrefs(id);
        }
        store
    }

    /// Ensure the second demo workspace (Huuk HQ) exists — also migrates older snapshots.
    pub fn ensure_demo_workspace(&mut self) {
        if self.workspaces.iter().any(|w| w.slug == "huuk-hq") {
            return;
        }
        let Some(user_id) = self.users.first().map(|u| u.id) else { return };
        let ws_id = self.id();
        self.workspaces.push(Workspace { id: ws_id, name: "Huuk HQ".into(), slug: "huuk-hq".into() });
        self.memberships.push((user_id, ws_id, "admin".into()));

        let ct_id = self.id();
        let now = Utc::now();
        self.content_types.push(ContentType {
            id: ct_id,
            workspace_id: ws_id,
            slug: "roadmap".into(),
            name: "Roadmap".into(),
            kind: "spreadsheet".into(),
            schema: Schema {
                fields: vec![
                    Field { name: "title".into(), kind: "text".into(), required: true, options: None, format: None },
                    Field {
                        name: "quarter".into(),
                        kind: "select".into(),
                        required: false,
                        options: Some(vec!["Q1".into(), "Q2".into(), "Q3".into(), "Q4".into()]),
                        format: None,
                    },
                    Field {
                        name: "status".into(),
                        kind: "select".into(),
                        required: false,
                        options: Some(vec!["planned".into(), "building".into(), "shipped".into()]),
                        format: None,
                    },
                ],
            },
            created_at: now,
            updated_at: now,
            deleted_at: None,
        });

        let entry_id = self.id();
        let mut data = Map::new();
        data.insert("title".into(), json!("Component library v2"));
        data.insert("quarter".into(), json!("Q4"));
        data.insert("status".into(), json!("building"));
        self.entries.push(Entry {
            id: entry_id,
            content_type_id: ct_id,
            data,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        });
    }

    // ---- auth ---------------------------------------------------------

    pub fn login(&mut self, email: &str, password: &str) -> ApiResult<String> {
        let user = self
            .users
            .iter()
            .find(|u| u.email.eq_ignore_ascii_case(email))
            .ok_or_else(|| ApiError::unauthorized("Invalid email or password"))?;
        if !verify_password(password, &user.password_hash) {
            return Err(ApiError::unauthorized("Invalid email or password"));
        }
        let user_id = user.id;
        let token = random_token();
        let active_workspace_id = self
            .memberships
            .iter()
            .find(|(uid, _, _)| *uid == user_id)
            .map(|(_, ws, _)| *ws);
        self.sessions.insert(
            token.clone(),
            Session {
                token: token.clone(),
                user_id,
                active_workspace_id,
                expires_at: Utc::now() + Duration::days(SESSION_TTL_DAYS),
            },
        );
        Ok(token)
    }

    pub fn logout(&mut self, token: &str) {
        self.sessions.remove(token);
    }

    pub fn user_for_token(&self, token: &str) -> Option<&User> {
        let session = self.sessions.get(token)?;
        if session.expires_at < Utc::now() {
            return None;
        }
        self.users.iter().find(|u| u.id == session.user_id)
    }

    pub fn memberships_for(&self, user_id: i64) -> Vec<Membership> {
        self.memberships
            .iter()
            .filter(|(uid, _, _)| *uid == user_id)
            .filter_map(|(_, ws_id, role)| {
                self.workspaces.iter().find(|w| w.id == *ws_id).map(|w| Membership {
                    workspace: w.clone(),
                    role: role.clone(),
                })
            })
            .collect()
    }

    /// Active workspace for a session, falling back to the user's first membership.
    pub fn active_workspace_id(&self, token: &str, user_id: i64) -> i64 {
        self.sessions
            .get(token)
            .and_then(|s| s.active_workspace_id)
            .filter(|id| self.memberships.iter().any(|(uid, ws, _)| *uid == user_id && ws == id))
            .or_else(|| {
                self.memberships
                    .iter()
                    .find(|(uid, _, _)| *uid == user_id)
                    .map(|(_, ws, _)| *ws)
            })
            .or_else(|| self.workspaces.first().map(|w| w.id))
            .unwrap_or(1)
    }

    pub fn switch_workspace(&mut self, token: &str, user_id: i64, workspace_id: i64) -> ApiResult<()> {
        let is_member = self
            .memberships
            .iter()
            .any(|(uid, ws, _)| *uid == user_id && *ws == workspace_id);
        if !is_member {
            return Err(ApiError::forbidden("You are not a member of that workspace"));
        }
        let session = self
            .sessions
            .get_mut(token)
            .ok_or_else(|| ApiError::unauthorized("Session expired"))?;
        session.active_workspace_id = Some(workspace_id);
        Ok(())
    }

    // ---- content types -------------------------------------------------

    pub fn content_types(&self) -> Vec<ContentType> {
        let mut list: Vec<_> = self.content_types.iter().filter(|t| t.deleted_at.is_none()).cloned().collect();
        list.sort_by_key(|t| t.id);
        list
    }

    pub fn content_types_in(&self, workspace_id: i64) -> Vec<ContentType> {
        let mut list: Vec<_> = self
            .content_types
            .iter()
            .filter(|t| t.deleted_at.is_none() && t.workspace_id == workspace_id)
            .cloned()
            .collect();
        list.sort_by_key(|t| t.id);
        list
    }

    pub fn content_type_by_slug(&self, slug: &str, workspace_id: i64) -> Option<&ContentType> {
        self.content_types
            .iter()
            .find(|t| t.slug == slug && t.workspace_id == workspace_id && t.deleted_at.is_none())
    }

    pub fn create_content_type(
        &mut self,
        workspace_id: i64,
        slug: &str,
        name: &str,
        kind: &str,
        schema: Schema,
    ) -> ApiResult<ContentType> {
        if self.content_type_by_slug(slug, workspace_id).is_some() {
            return Err(ApiError::conflict("A content type with that slug already exists"));
        }
        let id = self.id();
        let now = Utc::now();
        let ct = ContentType {
            id,
            workspace_id,
            slug: slug.into(),
            name: name.into(),
            kind: if kind.is_empty() { "document".into() } else { kind.into() },
            schema,
            created_at: now,
            updated_at: now,
            deleted_at: None,
        };
        self.content_types.push(ct.clone());
        Ok(ct)
    }

    pub fn update_content_type(
        &mut self,
        id: i64,
        name: Option<String>,
        kind: Option<String>,
        schema: Option<Schema>,
    ) -> ApiResult<ContentType> {
        let ct = self
            .content_types
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        if let Some(n) = name {
            if !n.trim().is_empty() {
                ct.name = n;
            }
        }
        if let Some(k) = kind {
            if !k.trim().is_empty() {
                ct.kind = k;
            }
        }
        if let Some(s) = schema {
            ct.schema = s;
        }
        ct.updated_at = Utc::now();
        Ok(ct.clone())
    }

    pub fn delete_content_type(&mut self, id: i64) -> ApiResult<()> {
        let ct = self
            .content_types
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| ApiError::not_found("Content type not found"))?;
        ct.deleted_at = Some(Utc::now());
        Ok(())
    }

    // ---- entries -------------------------------------------------------

    pub fn entries_for(&self, type_id: i64) -> Vec<&Entry> {
        let mut list: Vec<_> = self
            .entries
            .iter()
            .filter(|e| e.content_type_id == type_id && e.deleted_at.is_none())
            .collect();
        list.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        list
    }

    pub fn entry(&self, type_id: i64, id: i64) -> Option<&Entry> {
        self.entries
            .iter()
            .find(|e| e.id == id && e.content_type_id == type_id && e.deleted_at.is_none())
    }

    pub fn create_entry(&mut self, type_id: i64, data: Map<String, Value>) -> EntryView {
        let id = self.id();
        let now = Utc::now();
        let entry = Entry { id, content_type_id: type_id, data, created_at: now, updated_at: now, deleted_at: None };
        let view = EntryView::from(&entry);
        self.entries.push(entry);
        view
    }

    pub fn update_entry(&mut self, type_id: i64, id: i64, patch: Map<String, Value>) -> ApiResult<EntryView> {
        let entry = self
            .entries
            .iter_mut()
            .find(|e| e.id == id && e.content_type_id == type_id && e.deleted_at.is_none())
            .ok_or_else(|| ApiError::not_found("Entry not found"))?;
        for (k, v) in patch {
            entry.data.insert(k, v);
        }
        entry.updated_at = Utc::now();
        Ok(EntryView::from(entry))
    }

    pub fn delete_entry(&mut self, type_id: i64, id: i64) -> ApiResult<()> {
        let entry = self
            .entries
            .iter_mut()
            .find(|e| e.id == id && e.content_type_id == type_id && e.deleted_at.is_none())
            .ok_or_else(|| ApiError::not_found("Entry not found"))?;
        entry.deleted_at = Some(Utc::now());
        Ok(())
    }

    pub fn backrefs_to(&self, to: i64) -> Vec<Backref> {
        self.backrefs.iter().filter(|b| b.to_entry_id == Some(to)).cloned().collect()
    }

    /// Backrefs for the active workspace, optionally filtered by to/from/target.
    pub fn backrefs_query(
        &self,
        workspace_id: i64,
        to: Option<i64>,
        from: Option<i64>,
        target: Option<&str>,
    ) -> Vec<Backref> {
        let mut list: Vec<Backref> = self
            .backrefs
            .iter()
            .filter(|b| b.workspace_id == workspace_id)
            .filter(|b| to.map_or(true, |t| b.to_entry_id == Some(t)))
            .filter(|b| from.map_or(true, |f| b.from_entry_id == f))
            .filter(|b| {
                target.map_or(true, |t| {
                    b.target_name
                        .as_deref()
                        .map(|n| n.eq_ignore_ascii_case(t))
                        .unwrap_or(false)
                })
            })
            .cloned()
            .collect();
        list.sort_by(|a, b| b.id.cmp(&a.id));
        list.truncate(200);
        list
    }

    /// Re-scan one entry's string fields for `[[wiki-links]]` and rebuild its outgoing refs.
    pub fn rebuild_backrefs(&mut self, entry_id: i64) -> (usize, usize) {
        let Some(entry) = self
            .entries
            .iter()
            .find(|e| e.id == entry_id && e.deleted_at.is_none())
            .cloned()
        else {
            return (0, 0);
        };
        let Some(ct) = self.content_types.iter().find(|t| t.id == entry.content_type_id) else {
            return (0, 0);
        };
        let workspace_id = ct.workspace_id;

        let mut links: Vec<(String, Option<String>, i64, Option<String>)> = Vec::new();
        for value in entry.data.values() {
            let Value::String(s) = value else { continue };
            for (target, alias, offset) in parse_wiki_links(s) {
                let start = clamp_boundary(s, offset.saturating_sub(80));
                let end = clamp_boundary(s, (offset + 80).min(s.len()));
                links.push((target, alias, offset as i64, Some(s[start..end].to_string())));
            }
        }

        self.backrefs.retain(|b| b.from_entry_id != entry_id);

        let by_title: HashMap<String, i64> = self
            .entries
            .iter()
            .filter(|e| e.deleted_at.is_none() && e.id != entry_id)
            .filter_map(|e| {
                let in_workspace = self
                    .content_types
                    .iter()
                    .any(|c| c.id == e.content_type_id && c.workspace_id == workspace_id);
                if !in_workspace {
                    return None;
                }
                let title = e.data.get("title")?.as_str()?;
                Some((title.to_lowercase(), e.id))
            })
            .collect();

        let mut resolved = 0;
        let mut unresolved = 0;
        for (target, alias, offset, context) in links {
            let to = by_title.get(&target.to_lowercase()).copied();
            if to.is_some() {
                resolved += 1;
            } else {
                unresolved += 1;
            }
            let id = self.id();
            self.backrefs.push(Backref {
                id,
                workspace_id,
                from_entry_id: entry_id,
                to_entry_id: to,
                target_name: if to.is_none() { Some(target) } else { None },
                alias,
                offset,
                context,
            });
        }
        (resolved, unresolved)
    }

    /// Rebuild refs for every live entry in a workspace.
    pub fn rebuild_all_backrefs(&mut self, workspace_id: i64) -> (usize, usize, usize) {
        let ids: Vec<i64> = self
            .entries
            .iter()
            .filter(|e| e.deleted_at.is_none())
            .filter(|e| {
                self.content_types
                    .iter()
                    .any(|c| c.id == e.content_type_id && c.workspace_id == workspace_id)
            })
            .map(|e| e.id)
            .collect();
        let scanned = ids.len();
        let mut resolved = 0;
        let mut unresolved = 0;
        for id in ids {
            let (r, u) = self.rebuild_backrefs(id);
            resolved += r;
            unresolved += u;
        }
        (scanned, resolved, unresolved)
    }

    // ---- persistence ---------------------------------------------------

    pub fn save_to(&self, path: &Path) -> std::io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let bytes = serde_json::to_vec_pretty(self).unwrap_or_default();
        fs::write(path, bytes)
    }
}

/// Parse `[[target]]` / `[[target|alias]]` links with byte offsets.
pub fn parse_wiki_links(text: &str) -> Vec<(String, Option<String>, usize)> {
    let bytes = text.as_bytes();
    let mut out = Vec::new();
    let mut i = 0usize;
    while i + 1 < bytes.len() {
        if bytes[i] == b'[' && bytes[i + 1] == b'[' {
            if let Some(end) = text[i + 2..].find("]]") {
                let inner = &text[i + 2..i + 2 + end];
                if !inner.contains('[') && !inner.contains(']') {
                    let mut parts = inner.splitn(2, '|');
                    let target = parts.next().unwrap_or("").trim().to_string();
                    let alias = parts
                        .next()
                        .map(|a| a.trim().to_string())
                        .filter(|a| !a.is_empty());
                    if !target.is_empty() {
                        out.push((target, alias, i));
                    }
                    i = i + 2 + end + 2;
                    continue;
                }
            }
        }
        i += 1;
    }
    out
}

/// Nearest char boundary at or before `i` (UTF-8 safe slicing helper).
fn clamp_boundary(s: &str, mut i: usize) -> usize {
    if i >= s.len() {
        return s.len();
    }
    while i > 0 && !s.is_char_boundary(i) {
        i -= 1;
    }
    i
}

pub fn hash_password(password: &str) -> String {    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .unwrap_or_default()
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok(),
        Err(_) => false,
    }
}

pub fn random_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

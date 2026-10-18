-- Initial Pugu PostgreSQL schema (SOP §3.2 Expand-and-Contract compatible)

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    PRIMARY KEY (user_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_workspace_id BIGINT REFERENCES workspaces(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS content_types (
    id BIGINT PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'document',
    schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_types_workspace_slug ON content_types(workspace_id, slug);

CREATE TABLE IF NOT EXISTS entries (
    id BIGINT PRIMARY KEY,
    content_type_id BIGINT NOT NULL REFERENCES content_types(id) ON DELETE CASCADE,
    data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_entries_content_type_id ON entries(content_type_id);

CREATE TABLE IF NOT EXISTS backrefs (
    id BIGINT PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    from_entry_id BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    to_entry_id BIGINT REFERENCES entries(id) ON DELETE SET NULL,
    target_name TEXT,
    alias TEXT,
    byte_offset BIGINT NOT NULL DEFAULT 0,
    context TEXT
);

CREATE INDEX IF NOT EXISTS idx_backrefs_workspace_id ON backrefs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_backrefs_to_entry_id ON backrefs(to_entry_id);
CREATE INDEX IF NOT EXISTS idx_backrefs_from_entry_id ON backrefs(from_entry_id);

CREATE TABLE IF NOT EXISTS app_store_state (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    state_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

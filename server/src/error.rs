//! Unified Error Contract (SOP §6.4 — RFC 7807-style).

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../apps/src/api/types/")]
pub struct ApiErrorResponse {
    pub error_code: String,
    pub message: String,
    #[ts(type = "unknown", optional)]
    pub details: Option<serde_json::Value>,
    pub error: String,
}

#[derive(Debug)]
pub struct ApiError {
    pub status: StatusCode,
    pub error_code: &'static str,
    pub message: String,
    pub details: Option<Box<serde_json::Value>>,
}

impl ApiError {
    pub fn new(status: StatusCode, error_code: &'static str, message: impl Into<String>) -> Self {
        Self {
            status,
            error_code,
            message: message.into(),
            details: None,
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, "NOT_FOUND", message)
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, "VALIDATION_FAILED", message)
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::new(StatusCode::UNAUTHORIZED, "UNAUTHORIZED", message)
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, "FORBIDDEN", message)
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::new(StatusCode::CONFLICT, "CONFLICT", message)
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", message)
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(_err: sqlx::Error) -> Self {
        Self::internal("An unexpected database error occurred")
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let msg = self.message;
        (
            self.status,
            Json(ApiErrorResponse {
                error_code: self.error_code.into(),
                message: msg.clone(),
                details: self.details.map(|b| *b),
                error: msg,
            }),
        )
            .into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;

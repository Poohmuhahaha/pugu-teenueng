//! OpenDocument Spreadsheet (`.ods`) and `.csv` import/export engine.
//! Supports ODF 1.2/1.3 `<table:table>`, `table:number-columns-repeated`,
//! `table:number-rows-repeated`, `table:formula="of:=..."`, `<table:named-range>`,
//! and `<calcext:conditional-format>`.

use std::collections::HashMap;
use std::io::Write;
use std::process::{Command, Stdio};

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use crate::model::{ConditionalRuleMeta, SheetMeta};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ImportedSheet {
    pub name: String,
    pub rows: Vec<Map<String, Value>>,
    pub meta: SheetMeta,
}

pub fn col_to_letter(idx: usize) -> String {
    let mut s = String::new();
    let mut n = idx as isize;
    loop {
        let rem = (n % 26) as u8;
        s.insert(0, (b'a' + rem) as char);
        n = (n / 26) - 1;
        if n < 0 {
            break;
        }
    }
    s
}

#[allow(dead_code)]
pub fn letter_to_col(s: &str) -> Option<usize> {
    let clean = s.trim().trim_start_matches('$');
    if clean.is_empty() || !clean.chars().all(|c| c.is_ascii_alphabetic()) {
        return None;
    }
    let mut n = 0usize;
    for ch in clean.chars() {
        n = n * 26 + ((ch.to_ascii_uppercase() as usize) - 64);
    }
    Some(n.saturating_sub(1))
}

/// Normalize OpenFormula `of:=SUM([.B3:.B9]; [.C3:.C9])` into Pugu formula `=SUM(B3:B9, C3:C9)`.
pub fn normalize_odf_formula(raw: &str) -> String {
    let mut s = raw.trim().to_string();
    if let Some(rest) = s.strip_prefix("of:=") {
        s = format!("={rest}");
    } else if let Some(rest) = s.strip_prefix("of:") {
        s = rest.to_string();
    }
    // Replace bracketed cell/range references: [.B3:.B9] -> B3:B9, [$Sheet1.$A$1] -> Sheet1!$A$1
    let mut out = String::with_capacity(s.len());
    let chars: Vec<char> = s.chars().collect();
    let mut i = 0;
    let mut in_quotes = false;
    while i < chars.len() {
        if chars[i] == '"' {
            in_quotes = !in_quotes;
            out.push(chars[i]);
            i += 1;
            continue;
        }
        if !in_quotes && chars[i] == '[' {
            if let Some(end_offset) = chars[i + 1..].iter().position(|&c| c == ']') {
                let inner: String = chars[i + 1..i + 1 + end_offset].iter().collect();
                let converted: Vec<String> = inner
                    .split(':')
                    .map(|part| {
                        let p = part.trim();
                        if let Some(stripped) = p.strip_prefix('.') {
                            stripped.to_string()
                        } else if let Some(dot) = p.find('.') {
                            let sh = p[..dot].trim_start_matches('$');
                            let cell = &p[dot + 1..];
                            if sh.is_empty() {
                                cell.to_string()
                            } else {
                                format!("{sh}!{cell}")
                            }
                        } else {
                            p.to_string()
                        }
                    })
                    .collect();
                out.push_str(&converted.join(":"));
                i += end_offset + 2;
                continue;
            }
        }
        if !in_quotes && chars[i] == ';' {
            out.push(',');
            i += 1;
            continue;
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}

/// Convert Pugu formula `=SUM(B3:B9, C3:C9)` into OpenFormula `of:=SUM([.B3:.B9];[.C3:.C9])`.
pub fn to_odf_formula(raw: &str) -> String {
    let body = raw.trim().strip_prefix('=').unwrap_or(raw.trim());
    let replaced = body.replace(',', ";");
    format!("of:={replaced}")
}

// ---- CSV Import / Export -----------------------------------------------

pub fn parse_csv(content: &str) -> Vec<Map<String, Value>> {
    let mut rows = Vec::new();
    for line in content.lines() {
        if line.trim().is_empty() && rows.is_empty() {
            continue;
        }
        let fields = split_csv_line(line);
        let mut map = Map::new();
        for (idx, val) in fields.into_iter().enumerate() {
            if !val.is_empty() {
                map.insert(col_to_letter(idx), json!(val));
            }
        }
        rows.push(map);
    }
    rows
}

fn split_csv_line(line: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    let mut in_quotes = false;
    let chars: Vec<char> = line.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c == '"' {
            if in_quotes && i + 1 < chars.len() && chars[i + 1] == '"' {
                cur.push('"');
                i += 2;
                continue;
            }
            in_quotes = !in_quotes;
            i += 1;
            continue;
        }
        if c == ',' && !in_quotes {
            out.push(cur.trim_end_matches('\r').to_string());
            cur.clear();
            i += 1;
            continue;
        }
        cur.push(c);
        i += 1;
    }
    out.push(cur.trim_end_matches('\r').to_string());
    out
}

pub fn export_csv(columns: &[String], rows: &[Map<String, Value>]) -> String {
    let mut lines = Vec::with_capacity(rows.len());
    for row in rows {
        let cells: Vec<String> = columns
            .iter()
            .map(|col| {
                let s = row
                    .get(col)
                    .and_then(|v| match v {
                        Value::String(s) => Some(s.clone()),
                        Value::Number(n) => Some(n.to_string()),
                        Value::Bool(b) => Some(b.to_string()),
                        _ => None,
                    })
                    .unwrap_or_default();
                if s.contains(',') || s.contains('"') || s.contains('\n') {
                    format!("\"{}\"", s.replace('"', "\"\""))
                } else {
                    s
                }
            })
            .collect();
        lines.push(cells.join(","));
    }
    lines.join("\n")
}

// ---- ODS XML Parser ----------------------------------------------------

fn extract_attr(tag: &str, attr_name: &str) -> Option<String> {
    let pattern = format!("{attr_name}=\"");
    let start = tag.find(&pattern)? + pattern.len();
    let rest = &tag[start..];
    let end = rest.find('"')?;
    Some(xml_unescape(&rest[..end]))
}

fn xml_unescape(s: &str) -> String {
    s.replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn strip_xml_tags(xml: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for ch in xml.chars() {
        if ch == '<' {
            in_tag = true;
        } else if ch == '>' {
            in_tag = false;
        } else if !in_tag {
            out.push(ch);
        }
    }
    xml_unescape(out.trim())
}

/// Parse an ODF `content.xml` document into `ImportedSheet` records.
pub fn parse_ods_content_xml(xml: &str) -> Vec<ImportedSheet> {
    let mut sheets = Vec::new();
    let mut global_named_ranges: HashMap<String, String> = HashMap::new();

    // Parse global <table:named-range> tags
    let mut search_pos = 0;
    while let Some(idx) = xml[search_pos..].find("<table:named-range") {
        let abs = search_pos + idx;
        if let Some(end) = xml[abs..].find('>') {
            let tag = &xml[abs..abs + end + 1];
            if let (Some(name), Some(range)) = (
                extract_attr(tag, "table:name"),
                extract_attr(tag, "table:cell-range-address"),
            ) {
                let clean_range = normalize_odf_formula(&format!("[{range}]"));
                global_named_ranges.insert(name, clean_range);
            }
            search_pos = abs + end + 1;
        } else {
            break;
        }
    }

    // Parse each <table:table ...>...</table:table>
    let mut pos = 0;
    while let Some(t_start) = xml[pos..].find("<table:table ") {
        let abs_start = pos + t_start;
        let Some(t_end_rel) = xml[abs_start..].find("</table:table>") else {
            break;
        };
        let table_xml = &xml[abs_start..abs_start + t_end_rel + "</table:table>".len()];
        pos = abs_start + t_end_rel + "</table:table>".len();

        let header_end = table_xml.find('>').unwrap_or(0);
        let table_open_tag = &table_xml[..header_end];
        let sheet_name =
            extract_attr(table_open_tag, "table:name").unwrap_or_else(|| "Sheet1".into());

        let mut rows: Vec<Map<String, Value>> = Vec::new();
        let mut r_pos = header_end;
        while let Some(r_idx) = table_xml[r_pos..].find("<table:table-row") {
            let r_abs = r_pos + r_idx;
            let Some(r_open_end) = table_xml[r_abs..].find('>') else {
                break;
            };
            let r_tag = &table_xml[r_abs..r_abs + r_open_end + 1];
            let row_repeat = extract_attr(r_tag, "table:number-rows-repeated")
                .and_then(|v| v.parse::<usize>().ok())
                .unwrap_or(1);

            if r_tag.ends_with("/>") {
                if row_repeat <= 64 {
                    for _ in 0..row_repeat {
                        rows.push(Map::new());
                    }
                }
                r_pos = r_abs + r_open_end + 1;
                continue;
            }

            let Some(r_close_rel) = table_xml[r_abs..].find("</table:table-row>") else {
                break;
            };
            let row_inner = &table_xml[r_abs + r_open_end + 1..r_abs + r_close_rel];
            r_pos = r_abs + r_close_rel + "</table:table-row>".len();

            let mut row_map = Map::new();
            let mut col_idx = 0usize;
            let mut c_pos = 0usize;

            while c_pos < row_inner.len() {
                let next_cell = row_inner[c_pos..].find("<table:table-cell");
                let next_cov = row_inner[c_pos..].find("<table:covered-table-cell");
                let (c_rel, is_covered) = match (next_cell, next_cov) {
                    (Some(a), Some(b)) => {
                        if a <= b {
                            (a, false)
                        } else {
                            (b, true)
                        }
                    }
                    (Some(a), None) => (a, false),
                    (None, Some(b)) => (b, true),
                    (None, None) => break,
                };
                let c_abs = c_pos + c_rel;
                let Some(c_open_end) = row_inner[c_abs..].find('>') else {
                    break;
                };
                let c_tag = &row_inner[c_abs..c_abs + c_open_end + 1];
                let col_repeat = extract_attr(c_tag, "table:number-columns-repeated")
                    .and_then(|v| v.parse::<usize>().ok())
                    .unwrap_or(1);

                let self_closing = c_tag.ends_with("/>");
                let mut cell_val = String::new();

                if !self_closing {
                    let close_tag = if is_covered {
                        "</table:covered-table-cell>"
                    } else {
                        "</table:table-cell>"
                    };
                    if let Some(c_close_rel) = row_inner[c_abs..].find(close_tag) {
                        let cell_inner = &row_inner[c_abs + c_open_end + 1..c_abs + c_close_rel];
                        if let Some(f) = extract_attr(c_tag, "table:formula") {
                            cell_val = normalize_odf_formula(&f);
                        } else {
                            let text = strip_xml_tags(cell_inner);
                            if !text.is_empty() {
                                cell_val = text;
                            } else if let Some(v) = extract_attr(c_tag, "office:value") {
                                cell_val = v;
                            }
                        }
                        c_pos = c_abs + c_close_rel + close_tag.len();
                    } else {
                        c_pos = c_abs + c_open_end + 1;
                    }
                } else {
                    if let Some(f) = extract_attr(c_tag, "table:formula") {
                        cell_val = normalize_odf_formula(&f);
                    } else if let Some(v) = extract_attr(c_tag, "office:value") {
                        cell_val = v;
                    }
                    c_pos = c_abs + c_open_end + 1;
                }

                // Avoid expanding trailing empty columns with huge repeat counts (e.g. 1024)
                let effective_repeat = if cell_val.is_empty() && col_repeat > 32 {
                    1
                } else {
                    col_repeat.min(128)
                };
                for _ in 0..effective_repeat {
                    if !cell_val.is_empty() && col_idx < 128 {
                        row_map.insert(col_to_letter(col_idx), json!(cell_val));
                    }
                    col_idx += 1;
                }
            }

            let effective_row_repeat = if row_map.is_empty() && row_repeat > 16 {
                0
            } else {
                row_repeat.min(64)
            };
            for _ in 0..effective_row_repeat {
                rows.push(row_map.clone());
            }
        }

        // Trim trailing completely empty rows
        while rows.last().is_some_and(|r| r.is_empty()) {
            rows.pop();
        }

        // Parse conditional formats inside this table
        let mut cond_rules = Vec::new();
        let mut cf_pos = 0;
        while let Some(cf_idx) = table_xml[cf_pos..].find("<calcext:conditional-format") {
            let cf_abs = cf_pos + cf_idx;
            let Some(cf_end) = table_xml[cf_abs..].find("</calcext:conditional-format>") else {
                break;
            };
            let cf_block = &table_xml[cf_abs..cf_abs + cf_end];
            cf_pos = cf_abs + cf_end + "</calcext:conditional-format>".len();

            let range = extract_attr(cf_block, "calcext:target-range-address")
                .map(|r| {
                    r.split(':')
                        .map(|part| part.rsplit('.').next().unwrap_or(part).replace('$', ""))
                        .collect::<Vec<_>>()
                        .join(":")
                })
                .unwrap_or_else(|| "A1:D10".into());

            let rule_type = if cf_block.contains("<calcext:color-scale") {
                "colorScale"
            } else if cf_block.contains("<calcext:data-bar") {
                "dataBar"
            } else if cf_block.contains("<calcext:icon-set") {
                "iconSet"
            } else {
                "cellIs"
            };
            cond_rules.push(ConditionalRuleMeta {
                id: format!("ods-cf-{}", cond_rules.len() + 1),
                range,
                rule_type: rule_type.into(),
                operator: Some("gt".into()),
                value1: Some("0".into()),
                value2: None,
                color: None,
                bg: None,
                min_color: if rule_type == "colorScale" {
                    Some("#dcfce7".into())
                } else {
                    None
                },
                max_color: if rule_type == "colorScale" {
                    Some("#22c55e".into())
                } else {
                    None
                },
                bar_color: if rule_type == "dataBar" {
                    Some("rgba(37, 99, 235, 0.28)".into())
                } else {
                    None
                },
            });
        }

        sheets.push(ImportedSheet {
            name: sheet_name,
            rows,
            meta: SheetMeta {
                named_ranges: global_named_ranges.clone(),
                conditional_rules: cond_rules,
                ..Default::default()
            },
        });
    }

    sheets
}

/// Extract `content.xml` from `.ods` binary bytes (via `python3` zipfile or `unzip` or raw XML check).
pub fn extract_ods_content_xml(bytes: &[u8]) -> Result<String, String> {
    if bytes.starts_with(b"<?xml") || bytes.starts_with(b"<office:document-content") {
        return String::from_utf8(bytes.to_vec()).map_err(|e| e.to_string());
    }
    // Check if it's a STORED zip containing content.xml directly
    if let Some(xml) = extract_stored_zip_file(bytes, "content.xml") {
        return Ok(xml);
    }
    // Use python3's standard library zipfile to decompress deflated content.xml from memory
    let mut child = Command::new("python3")
        .arg("-c")
        .arg("import sys, zipfile, io; z = zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); sys.stdout.buffer.write(z.read('content.xml'))")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to spawn python3 for ods: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(bytes);
    }
    let output = child.wait_with_output().map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    String::from_utf8(output.stdout).map_err(|e| e.to_string())
}

fn extract_stored_zip_file(bytes: &[u8], target_name: &str) -> Option<String> {
    let mut pos = 0usize;
    while pos + 30 <= bytes.len() {
        if &bytes[pos..pos + 4] != b"PK\x03\x04" {
            break;
        }
        let method = u16::from_le_bytes([bytes[pos + 8], bytes[pos + 9]]);
        let comp_size = u32::from_le_bytes([
            bytes[pos + 18],
            bytes[pos + 19],
            bytes[pos + 20],
            bytes[pos + 21],
        ]) as usize;
        let name_len = u16::from_le_bytes([bytes[pos + 26], bytes[pos + 27]]) as usize;
        let extra_len = u16::from_le_bytes([bytes[pos + 28], bytes[pos + 29]]) as usize;
        let name_start = pos + 30;
        let data_start = name_start + name_len + extra_len;
        if data_start + comp_size > bytes.len() {
            break;
        }
        let name = std::str::from_utf8(&bytes[name_start..name_start + name_len]).ok()?;
        if name == target_name && method == 0 {
            return String::from_utf8(bytes[data_start..data_start + comp_size].to_vec()).ok();
        }
        pos = data_start + comp_size;
    }
    None
}

// ---- ODS Writer (ODF 1.2 compliant ZIP with STORED entries + CRC32) ----

fn crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB8_8320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

pub fn build_ods_content_xml(
    sheet_name: &str,
    columns: &[String],
    rows: &[Map<String, Value>],
    meta: Option<&SheetMeta>,
) -> String {
    let mut xml = String::from(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:calcext="urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0" office:version="1.2">
  <office:body>
    <office:spreadsheet>
"#,
    );

    xml.push_str(&format!(
        "      <table:table table:name=\"{}\">\n",
        xml_escape(sheet_name)
    ));
    for _ in columns {
        xml.push_str("        <table:table-column/>\n");
    }

    for row in rows {
        xml.push_str("        <table:table-row>\n");
        for col in columns {
            let val_str = row
                .get(col)
                .and_then(|v| match v {
                    Value::String(s) => Some(s.clone()),
                    Value::Number(n) => Some(n.to_string()),
                    Value::Bool(b) => Some(b.to_string()),
                    _ => None,
                })
                .unwrap_or_default();

            if val_str.is_empty() {
                xml.push_str("          <table:table-cell/>\n");
            } else if val_str.starts_with('=') || val_str.starts_with("of:=") {
                let odf_f = xml_escape(&to_odf_formula(&val_str));
                xml.push_str(&format!(
                    "          <table:table-cell table:formula=\"{odf_f}\" office:value-type=\"string\"><text:p>{}</text:p></table:table-cell>\n",
                    xml_escape(&val_str)
                ));
            } else if let Ok(num) = val_str.parse::<f64>() {
                xml.push_str(&format!(
                    "          <table:table-cell office:value-type=\"float\" office:value=\"{num}\"><text:p>{}</text:p></table:table-cell>\n",
                    xml_escape(&val_str)
                ));
            } else {
                xml.push_str(&format!(
                    "          <table:table-cell office:value-type=\"string\"><text:p>{}</text:p></table:table-cell>\n",
                    xml_escape(&val_str)
                ));
            }
        }
        xml.push_str("        </table:table-row>\n");
    }

    if let Some(m) = meta {
        if !m.conditional_rules.is_empty() {
            xml.push_str("        <calcext:conditional-formats>\n");
            for rule in &m.conditional_rules {
                xml.push_str(&format!(
                    "          <calcext:conditional-format calcext:target-range-address=\"{}.{}\">\n",
                    xml_escape(sheet_name),
                    xml_escape(&rule.range)
                ));
                match rule.rule_type.as_str() {
                    "colorScale" => xml.push_str("            <calcext:color-scale/>\n"),
                    "dataBar" => xml.push_str("            <calcext:data-bar/>\n"),
                    "iconSet" => xml.push_str("            <calcext:icon-set calcext:icon-set-type=\"3arrows\"/>\n"),
                    _ => xml.push_str("            <calcext:condition calcext:ApplyStyleName=\"Accent\" calcext:value=\">0\"/>\n"),
                }
                xml.push_str("          </calcext:conditional-format>\n");
            }
            xml.push_str("        </calcext:conditional-formats>\n");
        }
    }

    xml.push_str("      </table:table>\n");

    if let Some(m) = meta {
        if !m.named_ranges.is_empty() {
            xml.push_str("      <table:named-expressions>\n");
            for (name, rng) in &m.named_ranges {
                xml.push_str(&format!(
                    "        <table:named-range table:name=\"{}\" table:cell-range-address=\"{}\"/>\n",
                    xml_escape(name),
                    xml_escape(rng)
                ));
            }
            xml.push_str("      </table:named-expressions>\n");
        }
    }

    xml.push_str(
        r#"    </office:spreadsheet>
  </office:body>
</office:document-content>
"#,
    );
    xml
}

pub fn build_ods_zip(
    sheet_name: &str,
    columns: &[String],
    rows: &[Map<String, Value>],
    meta: Option<&SheetMeta>,
) -> Vec<u8> {
    let mimetype = b"application/vnd.oasis.opendocument.spreadsheet";
    let manifest = br#"<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>
"#;
    let content_xml = build_ods_content_xml(sheet_name, columns, rows, meta);

    let files: [(&str, &[u8]); 3] = [
        ("mimetype", mimetype),
        ("META-INF/manifest.xml", manifest),
        ("content.xml", content_xml.as_bytes()),
    ];

    let mut out = Vec::new();
    let mut central_dir = Vec::new();

    for (name, data) in files {
        let offset = out.len() as u32;
        let crc = crc32(data);
        let size = data.len() as u32;
        let name_bytes = name.as_bytes();
        let name_len = name_bytes.len() as u16;

        // Local file header
        out.extend_from_slice(b"PK\x03\x04");
        out.extend_from_slice(&20u16.to_le_bytes()); // version needed
        out.extend_from_slice(&0u16.to_le_bytes()); // flags
        out.extend_from_slice(&0u16.to_le_bytes()); // method 0 = STORED
        out.extend_from_slice(&0u16.to_le_bytes()); // mod time
        out.extend_from_slice(&0u16.to_le_bytes()); // mod date
        out.extend_from_slice(&crc.to_le_bytes());
        out.extend_from_slice(&size.to_le_bytes());
        out.extend_from_slice(&size.to_le_bytes());
        out.extend_from_slice(&name_len.to_le_bytes());
        out.extend_from_slice(&0u16.to_le_bytes()); // extra len
        out.extend_from_slice(name_bytes);
        out.extend_from_slice(data);

        // Central directory header
        central_dir.extend_from_slice(b"PK\x01\x02");
        central_dir.extend_from_slice(&20u16.to_le_bytes()); // version made by
        central_dir.extend_from_slice(&20u16.to_le_bytes()); // version needed
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // flags
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // method 0 = STORED
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // mod time
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // mod date
        central_dir.extend_from_slice(&crc.to_le_bytes());
        central_dir.extend_from_slice(&size.to_le_bytes());
        central_dir.extend_from_slice(&size.to_le_bytes());
        central_dir.extend_from_slice(&name_len.to_le_bytes());
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // extra len
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // comment len
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // disk start
        central_dir.extend_from_slice(&0u16.to_le_bytes()); // internal attrs
        central_dir.extend_from_slice(&0u32.to_le_bytes()); // external attrs
        central_dir.extend_from_slice(&offset.to_le_bytes());
        central_dir.extend_from_slice(name_bytes);
    }

    let cd_offset = out.len() as u32;
    let cd_size = central_dir.len() as u32;
    let count = files.len() as u16;
    out.extend_from_slice(&central_dir);

    // End of central directory record
    out.extend_from_slice(b"PK\x05\x06");
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());
    out.extend_from_slice(&cd_size.to_le_bytes());
    out.extend_from_slice(&cd_offset.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_odf_formula() {
        assert_eq!(
            normalize_odf_formula("of:=SUM([.B3:.B9]; [.C3:.C9])"),
            "=SUM(B3:B9, C3:C9)"
        );
        assert_eq!(
            normalize_odf_formula("of:=[$Sheet1.$A$1]*2"),
            "=Sheet1!$A$1*2"
        );
    }

    #[test]
    fn test_ods_roundtrip() {
        let cols = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let mut r1 = Map::new();
        r1.insert("a".into(), json!("Item"));
        r1.insert("b".into(), json!("10"));
        r1.insert("c".into(), json!("=SUM(B1:B1)"));
        let mut meta = SheetMeta::default();
        meta.named_ranges.insert("TotalCell".into(), "C1".into());

        let zip_bytes = build_ods_zip("Budget", &cols, &[r1], Some(&meta));
        let xml = extract_ods_content_xml(&zip_bytes).expect("extract content.xml");
        let sheets = parse_ods_content_xml(&xml);
        assert_eq!(sheets.len(), 1);
        assert_eq!(sheets[0].name, "Budget");
        assert_eq!(sheets[0].rows.len(), 1);
        assert_eq!(sheets[0].rows[0].get("a").unwrap(), "Item");
        assert_eq!(sheets[0].rows[0].get("b").unwrap(), "10");
        assert_eq!(sheets[0].rows[0].get("c").unwrap(), "=SUM(B1:B1)");
        assert_eq!(sheets[0].meta.named_ranges.get("TotalCell").unwrap(), "C1");
    }

    #[test]
    fn test_libreoffice_calc_ods_files() {
        let cl_path = std::path::Path::new(
            "/home/aslpooht/rea-work/calc-test/libreoffice-calc/help/media/files/scalc/cl-test.ods",
        );
        if cl_path.exists() {
            let bytes = std::fs::read(cl_path).expect("read cl-test.ods");
            let xml = extract_ods_content_xml(&bytes).expect("extract cl-test.ods content.xml");
            let sheets = parse_ods_content_xml(&xml);
            assert!(!sheets.is_empty(), "cl-test.ods should have sheets");
            assert!(!sheets[0].rows.is_empty(), "cl-test.ods should have rows");
        }

        let cf_path = std::path::Path::new("/home/aslpooht/rea-work/calc-test/libreoffice-calc/help/media/files/scalc/conditionalformatting.ods");
        if cf_path.exists() {
            let bytes = std::fs::read(cf_path).expect("read conditionalformatting.ods");
            let xml = extract_ods_content_xml(&bytes)
                .expect("extract conditionalformatting.ods content.xml");
            let sheets = parse_ods_content_xml(&xml);
            assert!(!sheets.is_empty());
            assert!(
                !sheets[0].meta.conditional_rules.is_empty(),
                "conditionalformatting.ods should parse calcext:conditional-format rules"
            );
        }
    }
}

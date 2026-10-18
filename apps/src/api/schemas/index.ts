// apps/vue/src/api/schemas/index.ts — Runtime Boundary Validation & AssertEqual Gates (SOP §6.3)
import { z } from 'zod'
import type { ActorDto } from '../types/ActorDto'
import type { ApiErrorResponse } from '../types/ApiErrorResponse'
import type { Backref as BackrefDto } from '../types/Backref'
import type { ConditionalRuleMeta as ConditionalRuleMetaDto } from '../types/ConditionalRuleMeta'
import type { ContentType as ContentTypeDto } from '../types/ContentType'
import type { Entry as EntryDto } from '../types/Entry'
import type { EntryView as EntryViewDto } from '../types/EntryView'
import type { Field as FieldDto } from '../types/Field'
import type { FieldFormat as FieldFormatDto } from '../types/FieldFormat'
import type { MeDto } from '../types/MeDto'
import type { Membership as MembershipDto } from '../types/Membership'
import type { MergedRangeMeta as MergedRangeMetaDto } from '../types/MergedRangeMeta'
import type { Schema as SchemaDto } from '../types/Schema'
import type { SheetMeta as SheetMetaDto } from '../types/SheetMeta'
import type { User as UserDto } from '../types/User'
import type { Workspace as WorkspaceDto } from '../types/Workspace'

// Compile-time type equality assertion helper (SOP §6.3)
export type AssertEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
  ? true
  : never

export const ApiErrorResponseSchema = z.object({
  error_code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  error: z.string(),
})
const _checkApiError: AssertEqual<z.infer<typeof ApiErrorResponseSchema>, ApiErrorResponse> = true

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
})
const _checkUser: AssertEqual<z.infer<typeof UserSchema>, UserDto> = true

export const WorkspaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
})
const _checkWorkspace: AssertEqual<z.infer<typeof WorkspaceSchema>, WorkspaceDto> = true

export const MembershipSchema = z.object({
  workspace: WorkspaceSchema,
  role: z.string(),
})
const _checkMembership: AssertEqual<z.infer<typeof MembershipSchema>, MembershipDto> = true

export const ActorDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  workspaceId: z.number().optional(),
})
const _checkActor: AssertEqual<z.infer<typeof ActorDtoSchema>, ActorDto> = true

export const MeDtoSchema = z.object({
  actor: ActorDtoSchema,
  memberships: z.array(MembershipSchema),
})
const _checkMe: AssertEqual<z.infer<typeof MeDtoSchema>, MeDto> = true

export const FieldFormatSchema = z.object({
  number: z.string().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strike: z.boolean().optional(),
  size: z.number().optional(),
  decimals: z.number().optional(),
  align: z.string().optional(),
  wrap: z.boolean().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
})
const _checkFieldFormat: AssertEqual<z.infer<typeof FieldFormatSchema>, FieldFormatDto> = true

export const FieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  format: FieldFormatSchema.optional(),
})
const _checkField: AssertEqual<z.infer<typeof FieldSchema>, FieldDto> = true

export const ConditionalRuleMetaSchema = z.object({
  id: z.string(),
  range: z.string(),
  type: z.enum(['colorScale', 'dataBar', 'iconSet', 'cellIs']),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'between', 'contains']).optional(),
  value1: z.string().optional(),
  value2: z.string().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
  minColor: z.string().optional(),
  maxColor: z.string().optional(),
  barColor: z.string().optional(),
})
const _checkConditionalRule: AssertEqual<
  z.infer<typeof ConditionalRuleMetaSchema>,
  ConditionalRuleMetaDto
> = true

export const MergedRangeMetaSchema = z.object({
  r1: z.number(),
  c1: z.number(),
  r2: z.number(),
  c2: z.number(),
})
const _checkMergedRange: AssertEqual<z.infer<typeof MergedRangeMetaSchema>, MergedRangeMetaDto> =
  true

export const SheetMetaSchema = z.object({
  namedRanges: z.record(z.string(), z.string()),
  conditionalRules: z.array(ConditionalRuleMetaSchema),
  mergedCells: z.array(MergedRangeMetaSchema),
  colWidths: z.record(z.string(), z.number()),
})
const _checkSheetMeta: AssertEqual<z.infer<typeof SheetMetaSchema>, SheetMetaDto> = true

export const SchemaSchema = z.object({
  fields: z.array(FieldSchema),
  meta: SheetMetaSchema.optional(),
})
const _checkSchema: AssertEqual<z.infer<typeof SchemaSchema>, SchemaDto> = true

export const ContentTypeSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  slug: z.string(),
  name: z.string(),
  kind: z.string(),
  schema: SchemaSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
})
const _checkContentType: AssertEqual<z.infer<typeof ContentTypeSchema>, ContentTypeDto> = true

export const EntryDtoSchema = z.object({
  id: z.number(),
  contentTypeId: z.number(),
  data: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
})
const _checkEntryDto: AssertEqual<z.infer<typeof EntryDtoSchema>, EntryDto> = true

export const EntryViewBaseSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
const _checkEntryView: AssertEqual<z.infer<typeof EntryViewBaseSchema>, EntryViewDto> = true

export const EntryViewSchema = EntryViewBaseSchema.passthrough()

export const BackrefSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  fromEntryId: z.number(),
  toEntryId: z.number().nullable(),
  targetName: z.string().nullable(),
  alias: z.string().optional(),
  offset: z.number(),
  context: z.string().optional(),
})
const _checkBackref: AssertEqual<z.infer<typeof BackrefSchema>, BackrefDto> = true

// Reference compile-time assertion constants so unused-locals check stays satisfied
export const CONTRACT_TYPE_CHECKS = [
  _checkApiError,
  _checkUser,
  _checkWorkspace,
  _checkMembership,
  _checkActor,
  _checkMe,
  _checkFieldFormat,
  _checkField,
  _checkConditionalRule,
  _checkMergedRange,
  _checkSheetMeta,
  _checkSchema,
  _checkContentType,
  _checkEntryDto,
  _checkEntryView,
  _checkBackref,
] as const

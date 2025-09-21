import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  complianceFramework: text("compliance_framework").notNull(),
  exportFormat: text("export_format").notNull(),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content"), // extracted text content
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const requirements = pgTable("requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  requirementId: text("requirement_id").notNull(), // REQ-001, REQ-002, etc.
  text: text("text").notNull(),
  type: text("type").notNull(), // Security, Data Privacy, Audit, etc.
  priority: text("priority").notNull(), // High, Medium, Low
  complianceSection: text("compliance_section"), // HIPAA §164.312(a)(1)
  confidence: integer("confidence"), // 0-100
  extractedAt: timestamp("extracted_at").defaultNow(),
});

export const testCases = pgTable("test_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  requirementId: varchar("requirement_id").notNull().references(() => requirements.id),
  testCaseId: text("test_case_id").notNull(), // TC-001, TC-002, etc.
  title: text("title").notNull(),
  type: text("type").notNull(), // Functional, Security, Edge Case, etc.
  priority: text("priority").notNull(),
  preconditions: text("preconditions"),
  testSteps: text("test_steps"),
  expectedResult: text("expected_result"),
  complianceSection: text("compliance_section"),
  isEdgeCase: boolean("is_edge_case").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const complianceMappings = pgTable("compliance_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  requirementId: varchar("requirement_id").notNull().references(() => requirements.id),
  section: text("section").notNull(), // HIPAA §164.312(a)(1)
  description: text("description").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  reasoning: text("reasoning"),
  framework: text("framework").notNull(), // HIPAA, ISO13485, FDA
});

export const aiExplanations = pgTable("ai_explanations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(), // requirement_extraction, test_generation, compliance_mapping
  entityId: varchar("entity_id").notNull(), // requirement_id or test_case_id
  reasoning: text("reasoning").notNull(),
  confidence: integer("confidence").notNull(),
  modelUsed: text("model_used").notNull(),
  processingTime: integer("processing_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertRequirementSchema = createInsertSchema(requirements).omit({
  id: true,
  extractedAt: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  generatedAt: true,
});

export const insertComplianceMappingSchema = createInsertSchema(complianceMappings).omit({
  id: true,
});

export const insertAiExplanationSchema = createInsertSchema(aiExplanations).omit({
  id: true,
  createdAt: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type ComplianceMapping = typeof complianceMappings.$inferSelect;
export type InsertComplianceMapping = z.infer<typeof insertComplianceMappingSchema>;

export type AiExplanation = typeof aiExplanations.$inferSelect;
export type InsertAiExplanation = z.infer<typeof insertAiExplanationSchema>;

// Response types for API
export const ProcessingStatus = z.object({
  step: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  message: z.string(),
  duration: z.number().optional(),
});

export const ProjectSummary = z.object({
  requirementsCount: z.number(),
  testCasesCount: z.number(),
  complianceCoverage: z.number(),
  edgeCasesCount: z.number(),
});

export type ProcessingStatusType = z.infer<typeof ProcessingStatus>;
export type ProjectSummaryType = z.infer<typeof ProjectSummary>;

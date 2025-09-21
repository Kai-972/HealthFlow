# AI-Powered Healthcare Compliance Test Case Generator

## Overview

This is a comprehensive web application that automates test case generation for healthcare compliance using AI. The system ingests healthcare requirements documents (PDF, DOCX, TXT), analyzes them against compliance frameworks like HIPAA, and automatically generates structured test cases with full traceability to regulatory requirements. The application provides an end-to-end workflow from document upload to export-ready test cases with AI explainability features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with strict TypeScript for type safety
- **ShadcN UI Components**: Comprehensive component library built on Radix UI primitives for consistent, accessible UI
- **Tailwind CSS**: Utility-first CSS framework with custom design system using CSS variables
- **Wouter Router**: Lightweight client-side routing solution
- **TanStack Query**: Data fetching and state management with caching and optimistic updates

### Backend Architecture
- **Express.js**: RESTful API server with middleware for request logging and error handling
- **ESM Modules**: Modern ES module system throughout the application
- **File Upload Handling**: Multer middleware for document uploads with file type validation
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Service Layer Pattern**: Separate services for document parsing, AI processing, and test case generation

### Database Schema Design
- **Projects**: Main entity tracking compliance framework and export format preferences
- **Documents**: File metadata and extracted content storage
- **Requirements**: Structured requirement data with compliance mapping
- **Test Cases**: Generated test cases linked to requirements with traceability
- **Compliance Mappings**: Regulatory section mappings with confidence scores
- **AI Explanations**: Audit trail of AI decision-making processes

### AI Processing Pipeline
- **Google Gemini API**: Large language model integration for natural language processing
- **Document Parser Service**: Multi-format document processing (PDF, DOCX, TXT)
- **Requirements Extraction**: NLP-based identification and classification of requirements
- **Test Case Generation**: AI-powered creation of comprehensive test scenarios
- **Compliance Mapping**: Automatic linking to regulatory frameworks with confidence scoring

### Data Flow Architecture
1. **Input Layer**: File upload with drag-and-drop support and format validation
2. **Processing Layer**: Document parsing → Requirements extraction → Test case generation → Compliance mapping
3. **Storage Layer**: Structured data persistence with full audit trail
4. **Output Layer**: Interactive dashboard with export capabilities (CSV, XML, Word, Jira)

### Security and Compliance
- **File Type Validation**: Restricted upload types with size limits
- **Error Handling**: Comprehensive error boundaries and graceful degradation
- **Session Management**: Secure session handling with automatic cleanup
- **Data Privacy**: HIPAA-compliant data handling patterns

## External Dependencies

### AI and ML Services
- **Google Gemini API**: Primary AI service for document analysis and test case generation
- **@google/genai**: Official Google AI SDK for Node.js integration

### Database and Storage
- **PostgreSQL**: Primary database via Drizzle ORM configuration
- **@neondatabase/serverless**: Serverless PostgreSQL driver for cloud deployment
- **Drizzle Kit**: Database migration and schema management tools

### Document Processing
- **Multer**: File upload middleware with validation
- **PDF-Parse**: PDF document text extraction capabilities
- **File System APIs**: Native Node.js file handling for document processing

### UI and Design System
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Lucide React**: Consistent icon library
- **Class Variance Authority**: Type-safe component variant management
- **React Hook Form**: Form validation and state management

### Development and Build Tools
- **Vite**: Modern build tool with HMR and optimized production builds
- **TSX**: TypeScript execution for development workflow
- **ESBuild**: Fast bundling for production server builds
- **PostCSS + Autoprefixer**: CSS processing and vendor prefixing

### Compliance Frameworks
- **HIPAA**: Health Insurance Portability and Accountability Act
- **ISO 13485**: Medical device quality management (planned)
- **FDA 21 CFR Part 11**: Electronic signature compliance (planned)
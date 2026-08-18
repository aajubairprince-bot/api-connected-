/**
 * Shokhi AI — Documentation API Endpoint
 * Lists available markdown docs and serves raw markdown content
 */

import fs from 'fs';
import path from 'path';
import { sendJsonResponse, sendJsonError } from '../lib/errors.js';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

const CATEGORIES = {
  'Overview & Architecture': [
    'ARCHITECTURE_REPORT.md',
    'TARGET_ARCHITECTURE.md',
    'PROJECT_AUDIT.md'
  ],
  'Database & Schema': [
    'ER_DIAGRAM.md',
    'DATABASE_DESIGN.md',
    'CURRENT_SUPABASE_SCHEMA.md',
    'SUPABASE_SETUP.md'
  ],
  'Security, Auth & RBAC': [
    'AUTHENTICATION_SPEC.md',
    'RBAC_SPEC.md',
    'MULTI_TENANT_SECURITY_SPEC.md',
    'SECURITY_HARDENING_SPEC.md'
  ],
  'AI, Gemini & Clinical Triage': [
    'GEMINI_HARDENING_SPEC.md',
    'EMERGENCY_SAFETY_SPEC.md',
    'VOICE_MULTIMODAL_SPEC.md',
    'USER_PROFILE_CONTEXT_SPEC.md',
    'CHAT_PERSISTENCE_SPEC.md'
  ],
  'Maternal Health & Notifications': [
    'MATERNITY_PERSISTENCE_SPEC.md',
    'NOTIFICATION_ENGINE_SPEC.md'
  ],
  'API & Frontend': [
    'API_REFERENCE.md',
    'FRONTEND_ARCHITECTURE.md',
    'FRONTEND_API_DEPENDENCY_MAP.md'
  ],
  'Data Flows & Admin': [
    'DATA_FLOW_DIAGRAMS.md',
    'ADMIN_PANEL_GUIDE.md',
    'ADMIN_PRACTICUM_METRICS_SPEC.md'
  ],
  'Testing & Quality Assurance': [
    'E2E_AUTOMATED_TEST_SPEC.md',
    'FLASK_NODE_PARITY_TEST.md',
    'ERROR_HANDLING_LOGGING_SPEC.md',
    'PERFORMANCE_OPTIMIZATION_SPEC.md'
  ],
  'Deployment & Containerization': [
    'DEPLOYMENT_RUNBOOK.md',
    'DOCKER_CONTAINERIZATION.md',
    'NODE_VERCEL_DEPLOYMENT_GUIDE.md',
    'NODE_MIGRATION_BASELINE.md',
    'FLASK_NODE_MIGRATION_MAP.md'
  ],
  'Academic Defense': [
    'FINAL_PRACTICUM_DEFENSE_SIGN_OFF.md',
    'DEFENSE_SLIDES_OUTLINE.md'
  ]
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const requestedFile = req.query?.file || req.query?.doc;

  // Single document retrieval
  if (requestedFile) {
    // Prevent directory traversal
    const safeFileName = path.basename(requestedFile);
    const targetPath = path.join(DOCS_DIR, safeFileName);

    if (!fs.existsSync(targetPath) || !targetPath.endsWith('.md')) {
      return sendJsonError(res, 404, `Document '${safeFileName}' not found`);
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const stat = fs.statSync(targetPath);
      return sendJsonResponse(res, 200, {
        filename: safeFileName,
        content,
        sizeBytes: stat.size,
        updatedAt: stat.mtime
      });
    } catch (err) {
      return sendJsonError(res, 500, `Failed to read document: ${err.message}`);
    }
  }

  // Listing all documents with categories and metadata
  try {
    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
    const docList = files.map(file => {
      const filePath = path.join(DOCS_DIR, file);
      const stat = fs.statSync(filePath);
      
      // Find category
      let category = 'General';
      for (const [catName, catFiles] of Object.entries(CATEGORIES)) {
        if (catFiles.includes(file)) {
          category = catName;
          break;
        }
      }

      // Generate human-friendly title
      const title = file
        .replace(/\.md$/, '')
        .replace(/_/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      return {
        filename: file,
        title,
        category,
        sizeBytes: stat.size,
        updatedAt: stat.mtime
      };
    });

    return sendJsonResponse(res, 200, {
      total: docList.length,
      categories: Object.keys(CATEGORIES),
      docs: docList
    });
  } catch (err) {
    return sendJsonError(res, 500, `Failed to list documents: ${err.message}`);
  }
}

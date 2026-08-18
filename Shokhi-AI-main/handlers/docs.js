/**
 * Shokhi AI — Documentation API Endpoint
 * Lists available markdown docs and serves markdown content
 * 100% Serverless-compatible with compiled in-memory catalog
 */

import fs from 'fs';
import path from 'path';
import { sendJsonResponse, sendJsonError } from '../lib/errors.js';
import { DOCS_CATALOG } from './docs_catalog.js';

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

function getCategoryForFile(filename) {
  for (const [catName, catFiles] of Object.entries(CATEGORIES)) {
    if (catFiles.includes(filename)) {
      return catName;
    }
  }
  return 'General';
}

function getTitleForFile(filename) {
  return filename
    .replace(/\.md$/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const requestedFile = req.query?.file || req.query?.doc;

  // 1. Single document retrieval
  if (requestedFile) {
    const safeFileName = path.basename(requestedFile);
    
    // Check in-memory compiled catalog first (100% serverless proof)
    if (DOCS_CATALOG && DOCS_CATALOG[safeFileName]) {
      const content = DOCS_CATALOG[safeFileName];
      return sendJsonResponse(res, 200, {
        filename: safeFileName,
        content,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        updatedAt: new Date().toISOString()
      });
    }

    // Try filesystem candidate locations
    const candidateDirs = [
      path.resolve(process.cwd(), 'docs'),
      path.resolve(process.cwd(), 'Shokhi-AI-main', 'docs'),
      path.resolve(process.cwd(), 'www', 'docs')
    ];

    for (const dir of candidateDirs) {
      const targetPath = path.join(dir, safeFileName);
      if (fs.existsSync(targetPath) && targetPath.endsWith('.md')) {
        try {
          const content = fs.readFileSync(targetPath, 'utf8');
          const stat = fs.statSync(targetPath);
          return sendJsonResponse(res, 200, {
            filename: safeFileName,
            content,
            sizeBytes: stat.size,
            updatedAt: stat.mtime
          });
        } catch (_) {}
      }
    }

    return sendJsonError(res, 404, `Document '${safeFileName}' not found`);
  }

  // 2. Listing all documents with categories and metadata
  const docList = [];
  const filenames = Object.keys(DOCS_CATALOG || {});

  // If catalog is available, use it
  if (filenames.length > 0) {
    filenames.forEach(file => {
      const content = DOCS_CATALOG[file];
      docList.push({
        filename: file,
        title: getTitleForFile(file),
        category: getCategoryForFile(file),
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        updatedAt: new Date().toISOString()
      });
    });
  } else {
    // Fallback to disk scan
    const candidateDirs = [
      path.resolve(process.cwd(), 'docs'),
      path.resolve(process.cwd(), 'Shokhi-AI-main', 'docs'),
      path.resolve(process.cwd(), 'www', 'docs')
    ];

    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        files.forEach(file => {
          if (!docList.find(d => d.filename === file)) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            docList.push({
              filename: file,
              title: getTitleForFile(file),
              category: getCategoryForFile(file),
              sizeBytes: stat.size,
              updatedAt: stat.mtime
            });
          }
        });
      }
    }
  }

  return sendJsonResponse(res, 200, {
    total: docList.length,
    categories: Object.keys(CATEGORIES),
    docs: docList
  });
}

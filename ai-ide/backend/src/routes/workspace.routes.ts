import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const router = Router();

// Environment variable for workspace root
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');

// Zod schemas for validation
const listFilesSchema = z.object({
  path: z.string().optional().default('')
});

const getFileSchema = z.object({
  path: z.string().min(1, 'File path is required')
});

const saveFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string().default('')
});

const deleteFileSchema = z.object({
  path: z.string().min(1, 'File path is required')
});

// Ensure workspace directory exists
async function ensureWorkspaceDir() {
  try {
    await fs.access(WORKSPACE_ROOT);
  } catch {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  }
}

// Helper function to validate file path (prevent directory traversal)
function validatePath(filePath: string): boolean {
  const resolved = path.resolve(WORKSPACE_ROOT, filePath);
  return resolved.startsWith(WORKSPACE_ROOT);
}

// GET /api/workspace/files - List directory contents
router.get('/files', async (req, res) => {
  try {
    await ensureWorkspaceDir();
    
    const query = listFilesSchema.parse(req.query);
    const targetPath = path.join(WORKSPACE_ROOT, query.path || '');
    
    // Security check
    if (!validatePath(targetPath)) {
      return res.status(400).json({ 
        error: 'Invalid path', 
        message: 'Directory traversal attack detected' 
      });
    }

    const stats = await fs.stat(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ 
        error: 'Not a directory',
        message: 'Path must point to a directory' 
      });
    }

    const files = await fs.readdir(targetPath, { withFileTypes: true });
    const fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(targetPath, file.name);
        const stat = await fs.stat(filePath);
        
        return {
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file',
          size: file.isDirectory() ? 0 : stat.size,
          modified: stat.mtime.toISOString(),
          path: path.relative(WORKSPACE_ROOT, filePath)
        };
      })
    );

    res.json({ files: fileList });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to list directory contents' 
    });
  }
});

// GET /api/workspace/file - Get single file content
router.get('/file', async (req, res) => {
  try {
    await ensureWorkspaceDir();
    
    const query = getFileSchema.parse(req.query);
    
    // Security check
    if (!validatePath(query.path)) {
      return res.status(400).json({ 
        error: 'Invalid path', 
        message: 'Directory traversal attack detected' 
      });
    }

    const filePath = path.join(WORKSPACE_ROOT, query.path);
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ 
        error: 'Is a directory',
        message: 'Cannot read a directory as a file' 
      });
    }

    const content = await fs.readFile(filePath, 'utf8');
    
    res.json({ 
      content,
      path: query.path,
      modified: stats.mtime.toISOString(),
      size: stats.size
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        error: 'File not found',
        message: 'The specified file does not exist' 
      });
    }
    
    console.error('Error reading file:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to read file' 
    });
  }
});

// POST /api/workspace/file - Create or update file
router.post('/file', async (req, res) => {
  try {
    await ensureWorkspaceDir();
    
    const body = saveFileSchema.parse(req.body);
    
    // Security check
    if (!validatePath(body.path)) {
      return res.status(400).json({ 
        error: 'Invalid path', 
        message: 'Directory traversal attack detected' 
      });
    }

    const filePath = path.join(WORKSPACE_ROOT, body.path);
    
    // Ensure parent directory exists
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, body.content, 'utf8');
    
    const stats = await fs.stat(filePath);
    
    res.json({ 
      message: 'File saved successfully',
      path: body.path,
      modified: stats.mtime.toISOString(),
      size: stats.size
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to save file' 
    });
  }
});

// DELETE /api/workspace/file - Delete file or directory
router.delete('/file', async (req, res) => {
  try {
    await ensureWorkspaceDir();
    
    const body = deleteFileSchema.parse(req.body);
    
    // Security check
    if (!validatePath(body.path)) {
      return res.status(400).json({ 
        error: 'Invalid path', 
        message: 'Directory traversal attack detected' 
      });
    }

    const filePath = path.join(WORKSPACE_ROOT, body.path);
    
    // Prevent deletion of workspace root
    const resolved = path.resolve(filePath);
    if (resolved === path.resolve(WORKSPACE_ROOT)) {
      return res.status(400).json({ 
        error: 'Invalid operation',
        message: 'Cannot delete workspace root directory' 
      });
    }

    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      // Remove directory and all contents
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      // Remove single file
      await fs.unlink(filePath);
    }
    
    res.json({ 
      message: 'File/directory deleted successfully',
      path: body.path
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ 
        error: 'File not found',
        message: 'The specified file/directory does not exist' 
      });
    }
    
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete file' 
    });
  }
});

// POST /api/workspace/mkdir - Create directory
router.post('/mkdir', async (req, res) => {
  try {
    await ensureWorkspaceDir();
    
    const schema = z.object({
      path: z.string().min(1, 'Directory path is required')
    });
    
    const body = schema.parse(req.body);
    
    // Security check
    if (!validatePath(body.path)) {
      return res.status(400).json({ 
        error: 'Invalid path', 
        message: 'Directory traversal attack detected' 
      });
    }

    const dirPath = path.join(WORKSPACE_ROOT, body.path);
    await fs.mkdir(dirPath, { recursive: true });
    
    res.json({ 
      message: 'Directory created successfully',
      path: body.path
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create directory' 
    });
  }
});

export default router;

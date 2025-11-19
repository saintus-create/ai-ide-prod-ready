import { Router } from 'express';
import { GitService } from '../git/service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const initSchema = z.object({
  path: z.string().min(1, 'Repository path is required')
});

const statusSchema = z.object({
  path: z.string().min(1, 'Repository path is required')
});

const commitSchema = z.object({
  path: z.string().min(1, 'Repository path is required'),
  message: z.string().min(1, 'Commit message is required'),
  files: z.array(z.string()).optional()
});

const pullSchema = z.object({
  path: z.string().min(1, 'Repository path is required'),
  remote: z.string().optional().default('origin'),
  branch: z.string().optional().default('main')
});

const pushSchema = z.object({
  path: z.string().min(1, 'Repository path is required'),
  remote: z.string().optional().default('origin'),
  branch: z.string().optional().default('main')
});

const diffSchema = z.object({
  path: z.string().min(1, 'Repository path is required'),
  file: z.string().optional(),
  staged: z.boolean().optional().default(false)
});

const branchSchema = z.object({
  path: z.string().min(1, 'Repository path is required'),
  name: z.string().min(1, 'Branch name is required'),
  from: z.string().optional().default('current')
});

const logSchema = z.object({
  path: z.string().min(1, 'Repository path is required'),
  limit: z.number().min(1).max(100).optional().default(10),
  file: z.string().optional()
});

// POST /api/git/init - Initialize repository
router.post('/init', async (req, res, next) => {
  try {
    const { path: repoPath } = initSchema.parse(req.body);
    const svc = new GitService(repoPath);
    await svc.init();
    res.json({ 
      success: true, 
      message: 'Git repository initialized successfully',
      path: repoPath 
    });
  } catch (e) {
    console.error('Git init error:', e);
    next(e);
  }
});

// GET /api/git/status - Get repository status
router.get('/status', async (req, res, next) => {
  try {
    const { path: repoPath } = statusSchema.parse(req.query);
    const svc = new GitService(repoPath);
    const status = await svc.status();
    
    res.json({
      success: true,
      status: status.isClean() ? 'clean' : 'dirty',
      ahead: status.ahead,
      behind: status.behind,
      staged: status.staged,
      modified: status.modified,
      not_added: status.not_added,
      deleted: status.deleted,
      renamed: status.renamed,
      files: status.files
    });
  } catch (e) {
    console.error('Git status error:', e);
    next(e);
  }
});

// POST /api/git/commit - Create a commit
router.post('/commit', async (req, res, next) => {
  try {
    const { path: repoPath, message, files } = commitSchema.parse(req.body);
    const svc = new GitService(repoPath);
    
    // Add specific files or all changes
    if (files && files.length > 0) {
      for (const file of files) {
        await svc.git.add(file);
      }
    } else {
      await svc.git.add('.');
    }
    
    const result = await svc.git.commit(message);
    
    res.json({
      success: true,
      message: 'Commit created successfully',
      hash: result.commit,
      summary: result.summary
    });
  } catch (e) {
    console.error('Git commit error:', e);
    next(e);
  }
});

// POST /api/git/pull - Pull changes from remote
router.post('/pull', async (req, res, next) => {
  try {
    const { path: repoPath, remote, branch } = pullSchema.parse(req.body);
    const svc = new GitService(repoPath);
    
    const result = await svc.git.pull(remote, branch);
    
    res.json({
      success: true,
      message: 'Pull completed successfully',
      summary: result.summary,
      files: result.files,
      insertions: result.insertions,
      deletions: result.deletions
    });
  } catch (e: any) {
    console.error('Git pull error:', e);
    const status = e.code === 'CONFLICT' ? 409 : 500;
    const message = e.code === 'CONFLICT' 
      ? 'Merge conflict occurred during pull'
      : 'Failed to pull from remote repository';
    
    res.status(status).json({
      success: false,
      error: message,
      details: e.message
    });
  }
});

// POST /api/git/push - Push changes to remote
router.post('/push', async (req, res, next) => {
  try {
    const { path: repoPath, remote, branch } = pushSchema.parse(req.body);
    const svc = new GitService(repoPath);
    
    const result = await svc.git.push(remote, branch);
    
    res.json({
      success: true,
      message: 'Push completed successfully',
      pushed: true,
      summary: result
    });
  } catch (e: any) {
    console.error('Git push error:', e);
    const status = e.code === 'CONFLICT' || e.code === 'REJECTED' ? 409 : 500;
    const message = e.code === 'CONFLICT'
      ? 'Push was rejected due to conflicts'
      : e.code === 'REJECTED'
      ? 'Push was rejected by remote server'
      : 'Failed to push to remote repository';
    
    res.status(status).json({
      success: false,
      error: message,
      details: e.message
    });
  }
});

// GET /api/git/log - Get commit history
router.get('/log', async (req, res, next) => {
  try {
    const { path: repoPath, limit, file } = logSchema.parse(req.query);
    const svc = new GitService(repoPath);
    
    const options: any = { n: limit };
    if (file) {
      options.file = file;
    }
    
    const log = await svc.git.log(options);
    
    res.json({
      success: true,
      commits: log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email
      })),
      total: log.total
    });
  } catch (e) {
    console.error('Git log error:', e);
    next(e);
  }
});

// GET /api/git/diff - Get diff for file or working directory
router.get('/diff', async (req, res, next) => {
  try {
    const { path: repoPath, file, staged } = diffSchema.parse(req.query);
    const svc = new GitService(repoPath);
    
    let diff: string;
    if (file) {
      diff = await svc.git.diff([staged ? '--cached' : '', file]);
    } else {
      diff = await svc.git.diff([staged ? '--cached' : '']);
    }
    
    res.json({
      success: true,
      diff,
      staged,
      file
    });
  } catch (e) {
    console.error('Git diff error:', e);
    next(e);
  }
});

// POST /api/git/branch - Create new branch
router.post('/branch', async (req, res, next) => {
  try {
    const { path: repoPath, name, from } = branchSchema.parse(req.body);
    const svc = new GitService(repoPath);
    
    if (from === 'current') {
      await svc.git.checkoutLocalBranch(name);
    } else {
      await svc.git.checkout(from);
      await svc.git.checkoutLocalBranch(name);
    }
    
    res.json({
      success: true,
      message: `Branch '${name}' created successfully`,
      name,
      from
    });
  } catch (e) {
    console.error('Git branch error:', e);
    next(e);
  }
});

// GET /api/git/branches - List all branches
router.get('/branches', async (req, res, next) => {
  try {
    const { path: repoPath } = statusSchema.parse(req.query);
    const svc = new GitService(repoPath);
    
    const branches = await svc.git.branch();
    
    res.json({
      success: true,
      current: branches.current,
      all: branches.all,
      local: branches.all.filter(b => !b.startsWith('remotes/')),
      remote: branches.all.filter(b => b.startsWith('remotes/'))
    });
  } catch (e) {
    console.error('Git branches error:', e);
    next(e);
  }
});

// POST /api/git/checkout - Switch branches or files
router.post('/checkout', async (req, res, next) => {
  try {
    const schema = z.object({
      path: z.string().min(1, 'Repository path is required'),
      branch: z.string().optional(),
      file: z.string().optional()
    });
    
    const { path: repoPath, branch, file } = schema.parse(req.body);
    const svc = new GitService(repoPath);
    
    if (file) {
      await svc.git.checkout([file]);
      res.json({
        success: true,
        message: `File '${file}' restored from HEAD`
      });
    } else if (branch) {
      await svc.git.checkout(branch);
      res.json({
        success: true,
        message: `Switched to branch '${branch}'`
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Either branch or file parameter is required'
      });
    }
  } catch (e) {
    console.error('Git checkout error:', e);
    next(e);
  }
});

export default router;
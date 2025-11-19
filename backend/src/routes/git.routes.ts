import { Router } from 'express';
import { GitService } from '../git/service';

const router = Router();

router.post('/init', async (req, res, next) => {
  try {
    const { path } = req.body;
    const svc = new GitService(path);
    await svc.init();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const { path } = req.query as any;
    const svc = new GitService(path);
    const status = await svc.status();
    res.json(status);
  } catch (e) {
    next(e);
  }
});

router.post('/pull', async (req, res, next) => {
  try {
    const { path, remote, branch } = req.body;
    const svc = new GitService(path);
    await svc.pull(remote, branch);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/push', async (req, res, next) => {
  try {
    const { path, remote, branch } = req.body;
    const svc = new GitService(path);
    await svc.push(remote, branch);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
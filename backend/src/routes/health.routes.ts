import { Router } from 'express';
import fs from 'fs/promises';

const router = Router();

// GET /health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check workspace directory access
    let workspaceAccessible = false;
    try {
      await fs.access('/workspace');
      workspaceAccessible = true;
    } catch {
      workspaceAccessible = false;
    }
    
    // Check environment variables
    const requiredEnvVars = ['CODESTRAL_API_KEY', 'HF_TOKEN'];
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        workspace: {
          status: workspaceAccessible ? 'healthy' : 'unhealthy',
          message: workspaceAccessible ? 'Workspace directory accessible' : 'Workspace directory not accessible'
        },
        environment: {
          status: missingEnvVars.length === 0 ? 'healthy' : 'partial',
          message: missingEnvVars.length === 0 ? 'All required environment variables set' : `Missing: ${missingEnvVars.join(', ')}`,
          missing: missingEnvVars
        },
        memory: {
          status: 'healthy',
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        uptime: {
          status: 'healthy',
          seconds: Math.round(process.uptime()),
          humanReadable: formatUptime(process.uptime())
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      platform: process.platform
    };
    
    // Determine overall health status
    const isHealthy = workspaceAccessible && missingEnvVars.length === 0;
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export default router;

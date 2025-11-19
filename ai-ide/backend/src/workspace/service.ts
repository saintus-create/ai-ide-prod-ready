import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

/**
 * Service that mirrors the real `workspace` directory.
 * It emits events that the WS layer forwards to all clients.
 */
export class WorkspaceService extends EventEmitter {
  readonly root = path.resolve(process.cwd(), 'workspace');

  constructor() {
    super();
  }

  async ensureRoot() {
    await fs.mkdir(this.root, { recursive: true });
  }

  private fullPath(rel: string) {
    return path.join(this.root, rel);
  }

  async readFile(rel: string): Promise<string> {
    return fs.readFile(this.fullPath(rel), 'utf8');
  }

  async writeFile(rel: string, content: string) {
    await fs.mkdir(path.dirname(this.fullPath(rel)), { recursive: true });
    await fs.writeFile(this.fullPath(rel), content, 'utf8');
    this.emit('file:changed', rel);
  }

  async deletePath(rel: string) {
    const target = this.fullPath(rel);
    await fs.rm(target, { recursive: true, force: true });
    this.emit('file:deleted', rel);
  }

  async getTree(dir = ''): Promise<FileNode[]> {
    const abs = this.fullPath(dir);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    const result: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const node: FileNode = {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      };
      if (entry.isDirectory()) {
        node.children = await this.getTree(path.join(dir, entry.name));
      }
      result.push(node);
    }
    return result;
  }
}
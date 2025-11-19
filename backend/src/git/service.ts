import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

export class GitService {
  private git: SimpleGit;

  constructor(private repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async init(): Promise<void> {
    await this.git.init();
    const ignore = `node_modules/\n.env\n`;
    await fs.writeFile(path.join(this.repoPath, '.gitignore'), ignore);
  }

  async status() {
    return this.git.status();
  }

  async pull(remote = 'origin', branch = 'main') {
    return this.git.pull(remote, branch);
  }

  async push(remote = 'origin', branch = 'main') {
    return this.git.push(remote, branch);
  }

  async commit(message: string) {
    await this.git.add('.');
    await this.git.commit(message);
  }
}
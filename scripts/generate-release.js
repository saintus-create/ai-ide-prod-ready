#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReleaseGenerator {
    constructor() {
        this.repoName = 'ai-ide-prod-ready';
        this.owner = 'saintus-create';
    }

    log(level, message) {
        const colors = {
            info: '\x1b[32m',
            warn: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`);
    }

    getCurrentVersion() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version;
    }

    getLatestTag() {
        try {
            const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
            return tag;
        } catch (error) {
            return 'v0.0.0';
        }
    }

    calculateNextVersion(currentVersion, releaseType) {
        // Remove 'v' prefix if present
        const version = currentVersion.replace(/^v/, '');
        const [major, minor, patch] = version.split('.').map(Number);
        
        switch (releaseType) {
            case 'major':
                return `${major + 1}.0.0`;
            case 'minor':
                return `${major}.${minor + 1}.0`;
            case 'patch':
                return `${major}.${minor}.${patch + 1}`;
            case 'auto':
            default:
                return this.autoDetectVersion(major, minor, patch);
        }
    }

    autoDetectVersion(major, minor, patch) {
        const latestTag = this.getLatestTag();
        
        try {
            const commits = execSync(`git log --pretty=format:"%s" ${latestTag}..HEAD`, { encoding: 'utf8' });
            
            if (/^(feat|fix|chore)!:/.test(commits) || 
                /BREAKING CHANGE|breaking change/i.test(commits)) {
                this.log('info', 'Detected breaking changes - incrementing major version');
                return `${major + 1}.0.0`;
            }
            
            if (/^feat:/.test(commits)) {
                this.log('info', 'Detected new features - incrementing minor version');
                return `${major}.${minor + 1}.0`;
            }
            
            if (/^fix:|^chore:|^refactor:|^test:/.test(commits)) {
                this.log('info', 'Detected fixes/chores - incrementing patch version');
                return `${major}.${minor}.${patch + 1}`;
            }
            
            this.log('warn', 'No significant changes detected - incrementing patch version');
            return `${major}.${minor}.${patch + 1}`;
        } catch (error) {
            this.log('warn', 'Could not detect version from commits - using patch increment');
            return `${major}.${minor}.${patch + 1}`;
        }
    }

    generateChangelog(previousTag, currentVersion) {
        this.log('info', `Generating changelog from ${previousTag} to current HEAD...`);
        
        let changelog = `# Changelog\n\n`;
        changelog += `All notable changes to this project will be documented in this file.\n\n`;
        changelog += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
        changelog += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;
        
        // Release header
        changelog += `## [${currentVersion}] - ${new Date().toISOString().split('T')[0]}\n\n`;
        
        const sections = {
            breaking: [],
            features: [],
            fixes: [],
            improvements: [],
            documentation: [],
            refactoring: [],
            testing: [],
            maintenance: []
        };
        
        try {
            const commits = execSync(`git log --pretty=format:"%s|%an|%ae" ${previousTag}..HEAD`, { encoding: 'utf8' });
            const commitLines = commits.split('\n').filter(line => line.trim());
            
            // Collect contributors
            const contributors = new Set();
            
            commitLines.forEach(commit => {
                const [message, author, email] = commit.split('|');
                contributors.add(`${author} <${email}>`);
                
                this.categorizeCommit(message, sections);
            });
            
            // Generate sections
            if (sections.breaking.length > 0) {
                changelog += `### ⚠️ Breaking Changes\n\n`;
                sections.breaking.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.features.length > 0) {
                changelog += `### ✨ Added\n\n`;
                sections.features.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.fixes.length > 0) {
                changelog += `### 🐛 Fixed\n\n`;
                sections.fixes.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.improvements.length > 0) {
                changelog += `### 🚀 Improvements\n\n`;
                sections.improvements.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.documentation.length > 0) {
                changelog += `### 📚 Documentation\n\n`;
                sections.documentation.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.refactoring.length > 0) {
                changelog += `### ♻️ Refactored\n\n`;
                sections.refactoring.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.testing.length > 0) {
                changelog += `### 🧪 Testing\n\n`;
                sections.testing.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            if (sections.maintenance.length > 0) {
                changelog += `### 🔧 Maintenance\n\n`;
                sections.maintenance.forEach(item => changelog += `- ${item}\n`);
                changelog += `\n`;
            }
            
            // Contributors section
            changelog += `### 👥 Contributors\n\n`;
            changelog += `Thanks to all contributors who made this release possible:\n\n`;
            Array.from(contributors).forEach(contributor => {
                changelog += `- ${contributor}\n`;
            });
            changelog += `\n`;
            
            // Release statistics
            changelog += `### 📊 Release Statistics\n\n`;
            changelog += `- Total commits: ${commitLines.length}\n`;
            changelog += `- Contributors: ${contributors.size}\n`;
            changelog += `- Files changed: ${this.getChangedFilesCount(previousTag)}\n`;
            
        } catch (error) {
            this.log('error', `Error generating changelog: ${error.message}`);
            changelog += `This release contains various improvements and fixes.\n`;
        }
        
        return changelog;
    }

    categorizeCommit(message, sections) {
        const cleanMessage = message.replace(/^\w+\([^)]*\):\s*/, '').trim();
        
        if (message.includes('!') || /BREAKING CHANGE|breaking change/i.test(message)) {
            sections.breaking.push(cleanMessage);
        } else if (message.startsWith('feat')) {
            sections.features.push(cleanMessage);
        } else if (message.startsWith('fix')) {
            sections.fixes.push(cleanMessage);
        } else if (message.startsWith('perf')) {
            sections.improvements.push(cleanMessage);
        } else if (message.startsWith('docs')) {
            sections.documentation.push(cleanMessage);
        } else if (message.startsWith('refactor')) {
            sections.refactoring.push(cleanMessage);
        } else if (message.startsWith('test')) {
            sections.testing.push(cleanMessage);
        } else if (message.startsWith('chore') || message.startsWith('ci')) {
            sections.maintenance.push(cleanMessage);
        }
    }

    getChangedFilesCount(previousTag) {
        try {
            const result = execSync(`git diff --name-only ${previousTag}..HEAD | wc -l`, { encoding: 'utf8' });
            return parseInt(result.trim());
        } catch (error) {
            return 0;
        }
    }

    async createGitHubRelease(version, changelog, prerelease = false) {
        this.log('info', `Creating GitHub release for version ${version}...`);
        
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable is required');
        }
        
        const releaseData = {
            tag_name: `v${version}`,
            target_commitish: 'main',
            name: `Release v${version}`,
            body: changelog,
            draft: false,
            prerelease: prerelease
        };
        
        const { URL } = require('url');
        const apiUrl = new URL(`https://api.github.com/repos/${this.owner}/${this.repoName}/releases`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(releaseData)
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const release = await response.json();
        return release.html_url;
    }

    async main() {
        const args = process.argv.slice(2);
        const releaseType = args[0] || 'auto';
        const prerelease = args.includes('--prerelease');
        
        this.log('info', 'Starting release process...');
        
        // Validate environment
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            this.log('error', 'GITHUB_TOKEN environment variable is required');
            process.exit(1);
        }
        
        try {
            // Get current state
            const currentVersion = this.getCurrentVersion();
            const latestTag = this.getLatestTag();
            const nextVersion = this.calculateNextVersion(currentVersion, releaseType);
            
            this.log('info', `Current version: ${currentVersion}`);
            this.log('info', `Latest tag: ${latestTag}`);
            this.log('info', `Next version: ${nextVersion}`);
            
            // Generate changelog
            const changelog = this.generateChangelog(latestTag, nextVersion);
            
            // Save changelog to temp file
            const tempFile = path.join(__dirname, '..', 'release-notes.md');
            fs.writeFileSync(tempFile, changelog);
            
            // Create GitHub release
            const releaseUrl = await this.createGitHubRelease(nextVersion, changelog, prerelease);
            this.log('info', `Release created: ${releaseUrl}`);
            
            // Update package.json
            this.log('info', 'Updating package.json...');
            execSync(`npm version ${nextVersion} --no-git-tag-version`);
            
            this.log('info', `Release v${nextVersion} completed successfully!`);
            
        } catch (error) {
            this.log('error', `Release failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new ReleaseGenerator();
    generator.main().catch(error => {
        console.error('Release generation failed:', error);
        process.exit(1);
    });
}

module.exports = ReleaseGenerator;
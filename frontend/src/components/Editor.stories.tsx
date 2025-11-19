import type { Meta, StoryObj } from '@storybook/react';
import { Editor } from '../components/Editor';
import { useState } from 'react';

const meta = {
  title: 'Components/Editor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Multi-tab code editor with CodeMirror 6, syntax highlighting, and AI autocomplete.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    files: {
      description: 'Array of open file tabs',
      control: 'object',
    },
    activeFile: {
      description: 'Currently active file',
      control: 'object',
    },
    onFileChange: {
      action: 'fileChanged',
      description: 'Callback fired when active file changes',
    },
    onFileClose: {
      action: 'fileClosed',
      description: 'Callback fired when file tab is closed',
    },
    onFileSave: {
      action: 'fileSaved',
      description: 'Callback fired when file is saved',
    },
  },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

const EditorWrapper = ({ initialFiles = [] }: { initialFiles?: any[] }) => {
  const [files, setFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState(null);

  return (
    <Editor
      files={files}
      activeFile={activeFile}
      onFileChange={setActiveFile}
      onFileClose={(file) => setFiles(files.filter(f => f.id !== file.id))}
      onFileSave={(file) => console.log('Saving file:', file)}
    />
  );
};

export const Default: Story = {
  render: () => (
    <EditorWrapper
      initialFiles={[
        {
          id: '1',
          name: 'index.js',
          content: 'console.log("Hello, World!");',
          path: '/src/index.js',
          language: 'javascript',
          unsaved: false,
          pinned: false,
        },
        {
          id: '2',
          name: 'app.py',
          content: 'print("Hello from Python!")',
          path: '/src/app.py',
          language: 'python',
          unsaved: true,
          pinned: false,
        },
      ]}
    />
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Code editor with multiple tabs, showing JavaScript and Python files with syntax highlighting.',
      },
    },
  },
};

export const WithPinnedFiles: Story = {
  render: () => (
    <EditorWrapper
      initialFiles={[
        {
          id: '1',
          name: 'README.md',
          content: '# AI-IDE\n\nA modern development environment.',
          path: '/README.md',
          language: 'markdown',
          unsaved: false,
          pinned: true,
        },
        {
          id: '2',
          name: 'config.json',
          content: '{\n  "name": "ai-ide"\n}',
          path: '/config.json',
          language: 'json',
          unsaved: false,
          pinned: true,
        },
        {
          id: '3',
          name: 'app.js',
          content: 'const app = require("./app");',
          path: '/src/app.js',
          language: 'javascript',
          unsaved: true,
          pinned: false,
        },
      ]}
    />
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Editor with pinned tabs (README and config) that cannot be easily closed.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => <EditorWrapper initialFiles={[]} />,
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Empty editor state with no open files.',
      },
    },
  },
};

export const WithCSS: Story = {
  render: () => (
    <EditorWrapper
      initialFiles={[
        {
          id: '1',
          name: 'styles.css',
          content: `body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`,
          path: '/src/styles.css',
          language: 'css',
          unsaved: false,
          pinned: false,
        },
      ]}
    />
  ),
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Editor showing CSS file with syntax highlighting.',
      },
    },
  },
};
import { AIProvider } from '@/types';

interface Props {
  value: AIProvider;
  onChange: (p: AIProvider) => void;
}

export default function ProviderSelect({ value, onChange }: Props) {
  const options: AIProvider[] = ['codestral', 'chatgpt-oss', 'dkimi'];

  return (
    <select
      className="bg-surface/30 text-gray-100 rounded px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value as AIProvider)}
    >
      {options.map((p) => (
        <option key={p} value={p}>
          {p === 'codestral'
            ? 'Codestral (FIM)'
            : p === 'chatgpt-oss'
            ? 'ChatGPT‑OSS'
            : 'dKimi'}
        </option>
      ))}
    </select>
  );
}
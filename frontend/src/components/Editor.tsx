import MonacoEditor from "@monaco-editor/react";
import type { Language } from "../types";

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
}

const FALLBACK_CODE: Record<Language, string> = {
  cpp: `class Solution {
public:
    // write your solution here
};`,
  python: `class Solution:
    # write your solution here
    pass
`,
};

export function Editor({ language, onLanguageChange, code, onCodeChange, onRun, onSubmit, isRunning }: Props) {
  const handleLangSwitch = (lang: Language) => {
    if (lang === language) return;
    onLanguageChange(lang);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3 py-1.5 bg-gray-900/80 border-b border-gray-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="font-medium text-gray-300">Code</span>
        </div>
        <div className="ml-4 flex items-center gap-0.5 bg-gray-800 rounded p-0.5">
          <button
            onClick={() => handleLangSwitch("cpp")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              language === "cpp"
                ? "bg-gray-600 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            C++
          </button>
          <button
            onClick={() => handleLangSwitch("python")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              language === "python"
                ? "bg-gray-600 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Python 3
          </button>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onRun}
            disabled={isRunning}
            className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Run
          </button>
          <button
            onClick={onSubmit}
            disabled={isRunning}
            className="px-3 py-1.5 bg-green-600 rounded text-xs font-medium text-white hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? "Judging..." : "Submit"}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={language === "cpp" ? "cpp" : "python"}
          theme="vs-dark"
          value={code}
          onChange={(val) => onCodeChange(val || "")}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            renderLineHighlight: "line",
            suggestOnTriggerCharacters: true,
            tabSize: 4,
          }}
        />
      </div>
      <div className="px-3 py-1 bg-gray-900/80 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <span>Saved</span>
        <span>Ln 1, Col 1</span>
      </div>
    </div>
  );
}

export { FALLBACK_CODE };

"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

interface CodeBlockProps {
  code: string;
  language: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
        >
          {copied ? (
            <>
              <FiCheck className="text-green-400" />
              <span className="text-xs text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <FiCopy />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-300 font-mono">{code}</code>
      </pre>
    </div>
  );
}

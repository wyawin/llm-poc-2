import React from 'react';
import { FileSearch, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasDocuments: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasDocuments }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FileSearch className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Credit Analysis Platform</h1>
              <p className="text-blue-100">AI-powered document analysis with Ollama</p>
            </div>
          </div>
          
          {hasDocuments && (
            <button
              onClick={onReset}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Analysis
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
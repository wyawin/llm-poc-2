import React from 'react';
import { FileSearch, RotateCcw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasDocuments: boolean;
  backendHealth: string;
  onHealthCheck: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasDocuments, backendHealth, onHealthCheck }) => {
  const getHealthIcon = () => {
    switch (backendHealth) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-red-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getHealthText = () => {
    switch (backendHealth) {
      case 'connected': return 'Backend Connected';
      case 'disconnected': return 'Backend Disconnected';
      case 'error': return 'Backend Error';
      default: return 'Checking...';
    }
  };

  const getHealthColor = () => {
    switch (backendHealth) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

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
          
          <div className="flex items-center gap-4">
            {/* Backend Health Status */}
            <button
              onClick={onHealthCheck}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="Click to refresh connection status"
            >
              {getHealthIcon()}
              <span className={`text-sm ${getHealthColor()}`}>
                {getHealthText()}
              </span>
            </button>

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
      </div>
    </header>
  );
};

export default Header;
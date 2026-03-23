import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onFileSelect: (content: string, fileName: string) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown')) {
      setSelectedFile(file);
      readFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelect(content, file.name);
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
          isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          accept=".md"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-zinc-600 font-medium">Gemini 正在深度解析論文中...</p>
              <p className="text-zinc-400 text-sm italic">這可能需要 30-60 秒，請稍候</p>
            </motion.div>
          ) : selectedFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-200"
            >
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="text-zinc-700 font-medium">{selectedFile.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-1 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-zinc-900 font-semibold text-lg">點擊或拖拽上傳論文</p>
                <p className="text-zinc-500">僅支援 .md 格式檔案</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

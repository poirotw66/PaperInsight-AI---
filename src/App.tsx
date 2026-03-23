/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { analyzePaper, ExtractedImage } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Archive, Copy, Check, Sparkles, ChevronRight, FileText } from 'lucide-react';
import JSZip from 'jszip';

export default function App() {
  const [report, setReport] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = async (content: string, name: string) => {
    setIsProcessing(true);
    setFileName(name);
    try {
      const { report: result, images } = await analyzePaper(content);
      setReport(result);
      setExtractedImages(images);
    } catch (error) {
      alert('解析失敗，請檢查 API Key 或檔案內容。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    if (!report) return;

    const zip = new JSZip();
    const folderName = fileName.replace('.md', '') || 'paper_analysis';
    const mainFolder = zip.folder(folderName);
    
    if (!mainFolder) return;

    // Add the markdown report
    mainFolder.file('report.md', report);

    // Add images folder
    const imagesFolder = mainFolder.folder('images');
    if (imagesFolder) {
      for (const img of extractedImages) {
        // Convert base64 to binary
        const binaryString = window.atob(img.base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imagesFolder.file(img.filename, bytes);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}_analysis.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to render markdown with local image preview (using base64 for preview only)
  const renderMarkdown = (md: string) => {
    let processedMd = md;
    extractedImages.forEach(img => {
      const placeholder = `images/${img.filename}`;
      const base64Url = `data:${img.mimeType};base64,${img.base64Data}`;
      processedMd = processedMd.split(`(${placeholder})`).join(`(${base64Url})`);
    });
    return processedMd;
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">PaperInsight AI</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
            <span className="hidden sm:inline">基於「三遍掃描法」</span>
            <ChevronRight className="w-4 h-4 hidden sm:inline" />
            <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Gemini 3.1 Pro 驅動</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold mb-6 tracking-tight text-zinc-900"
          >
            把論文讀透，只需 <span className="text-emerald-600">三遍</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed"
          >
            整合 Keshav 的 Three-pass 與李沐老師的實戰節奏。
            上傳 Markdown 論文，讓 AI 為你生成結構化的精讀報告。
          </motion.p>
        </section>

        {/* Upload Section */}
        <section className="mb-12">
          <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
        </section>

        {/* Result Section */}
        <AnimatePresence>
          {report && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="border-b border-zinc-100 px-8 py-6 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-bold text-lg text-zinc-800">解析報告：{fileName}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded-xl transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? '已複製' : '複製 Markdown'}
                  </button>
                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl transition-all shadow-lg shadow-zinc-200"
                  >
                    <Archive className="w-4 h-4" />
                    下載 ZIP 封裝檔
                  </button>
                </div>
              </div>

              <div className="p-8 sm:p-12 prose prose-zinc max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:pb-2 prose-h2:mt-12 prose-h3:text-xl prose-p:text-zinc-600 prose-p:leading-relaxed prose-li:text-zinc-600 prose-strong:text-zinc-900 prose-code:text-emerald-600 prose-code:bg-emerald-50 prose-code:px-1 prose-code:rounded prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto">
                <ReactMarkdown>{renderMarkdown(report)}</ReactMarkdown>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Methodology Info */}
        {!report && !isProcessing && (
          <section className="grid sm:grid-cols-3 gap-8 mt-24">
            <div className="p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4 font-bold text-zinc-400">01</div>
              <h3 className="font-bold text-lg mb-2">第一遍：海選</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                5-10 分鐘鳥瞰。讀標題、摘要、導言與結論。判斷這篇論文是否值得你投入更多時間。
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4 font-bold text-zinc-400">02</div>
              <h3 className="font-bold text-lg mb-2">第二遍：精選</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                30-60 分鐘通讀。抓住方法、證據與圖表。不陷入推導細節，但能向他人轉述核心貢獻。
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center mb-4 font-bold text-zinc-400">03</div>
              <h3 className="font-bold text-lg mb-2">第三遍：研讀</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                1-5 小時吃透。嘗試「虛擬重做一遍」。挖掘隱含假設，找出可複現路徑與改進點。
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-400 text-sm">
            &copy; 2026 PaperInsight AI. Inspired by S. Keshav & 李沐.
          </p>
        </div>
      </footer>
    </div>
  );
}

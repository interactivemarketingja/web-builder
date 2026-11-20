import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2 } from 'lucide-react';
import { ExportOptions, SiteProject } from '../types/builder';
import { generateCleanCss, generateCleanHtml } from '../utils/codeGenerator';

interface CodeHandoffViewProps {
  project: SiteProject;
  options: ExportOptions;
  onChangeOptions: (patch: Partial<ExportOptions>) => void;
}

type CodeTab = 'html' | 'css' | 'bundle';

export const CodeHandoffView: React.FC<CodeHandoffViewProps> = ({
  project,
  options,
  onChangeOptions,
}) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const htmlCode = useMemo(
    () => generateCleanHtml(project, options, false),
    [project, options]
  );
  const cssCode = useMemo(
    () => generateCleanCss(project.theme, options),
    [project.theme, options]
  );
  const bundleCode = useMemo(
    () => generateCleanHtml(project, options, true),
    [project, options]
  );

  const activeCode =
    activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : bundleCode;

  const lines = useMemo(() => activeCode.split('\n'), [activeCode]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F4F2EC]">
      {/* Left Handoff Configuration Panel */}
      <aside className="w-[316px] shrink-0 bg-white border-r border-[#DAD4C6] p-5 flex flex-col justify-between overflow-y-auto studio-scroll">
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-black">
              Developer Handoff
            </h2>
            <p className="text-sm text-black mt-1 leading-relaxed">
              Semantic HTML5 and zero-dependency CSS3 compiled directly from your active canvas and tokens.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#DAD4C6]">
            <div className="text-sm font-semibold text-black">
              Output Customization
            </div>

            <div>
              <label
                htmlFor="css-prefix-input"
                className="block text-[13px] font-medium text-black mb-1"
              >
                CSS Class Prefix
              </label>
              <input
                id="css-prefix-input"
                type="text"
                value={options.prefix}
                onChange={(e) => onChangeOptions({ prefix: e.target.value })}
                placeholder="af-"
                className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div>
              <label
                htmlFor="form-endpoint-input"
                className="block text-[13px] font-medium text-black mb-1"
              >
                Contact Form POST URL (Optional)
              </label>
              <input
                id="form-endpoint-input"
                type="text"
                value={options.formEndpoint || ''}
                onChange={(e) =>
                  onChangeOptions({ formEndpoint: e.target.value })
                }
                placeholder={`/api/sites/${project.slug || 'site'}/submit`}
                className="w-full rounded-lg border border-[#DAD4C6] px-2.5 py-1.5 text-sm font-mono text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <label className="flex items-center justify-between gap-2 text-sm text-black cursor-pointer">
              <span>Use :root CSS Variables</span>
              <input
                type="checkbox"
                checked={options.useCssVariables}
                onChange={(e) =>
                  onChangeOptions({ useCssVariables: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-sm text-black cursor-pointer">
              <span>Include Base CSS Reset</span>
              <input
                type="checkbox"
                checked={options.includeReset}
                onChange={(e) =>
                  onChangeOptions({ includeReset: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-sm text-black cursor-pointer">
              <span>Minify Production Output</span>
              <input
                type="checkbox"
                checked={options.minify}
                onChange={(e) => onChangeOptions({ minify: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </label>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-[#DAD4C6]">
            <div className="text-sm font-semibold text-black">
              Download Files
            </div>
            <button
              type="button"
              onClick={() => downloadFile('index.html', htmlCode, 'text/html')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-sm font-medium text-black cursor-pointer"
            >
              <span>index.html</span>
              <Download className="w-4 h-4 text-black" />
            </button>
            <button
              type="button"
              onClick={() => downloadFile('styles.css', cssCode, 'text/css')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#DAD4C6] hover:bg-[#FAF9F5] text-sm font-medium text-black cursor-pointer"
            >
              <span>styles.css</span>
              <Download className="w-4 h-4 text-black" />
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  `${project.slug || 'site'}-standalone.html`,
                  bundleCode,
                  'text/html'
                )
              }
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#13151A] hover:bg-black text-sm font-semibold text-white cursor-pointer"
            >
              <span>Standalone Bundle (.html)</span>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-[#DAD4C6] text-[13px] text-black space-y-1 tabular-nums">
          <div className="flex justify-between">
            <span>HTML Size</span>
            <span className="font-mono">{(htmlCode.length / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between">
            <span>CSS Size</span>
            <span className="font-mono">{(cssCode.length / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between">
            <span>Sections</span>
            <span className="font-mono">{project.blocks.length}</span>
          </div>
        </div>
      </aside>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-[#13151A] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#1B1E25] border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-[#13151A] rounded-lg border border-slate-800">
              {(
                [
                  ['html', 'index.html'],
                  ['css', 'styles.css'],
                  ['bundle', 'standalone.html'],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-mono transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(activeCode, activeTab)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedKey === activeTab ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy {activeTab === 'css' ? 'CSS' : 'HTML'}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto studio-scroll p-4 font-mono text-sm leading-6 text-slate-100">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-slate-900/60">
                    <td className="select-none pr-4 text-right text-slate-400 tabular-nums w-10 align-top">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre text-slate-100">{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 bg-slate-900/90 text-white rounded-2xl border border-rose-500/30 shadow-xl space-y-4 my-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="text-center space-y-1 max-w-lg">
            <h3 className="text-lg font-black text-white">
              {this.props.fallbackTitle || '화면을 렌더링하는 중 오류가 발생했습니다.'}
            </h3>
            <p className="text-xs text-slate-300">
              일시적인 데이터 동기화 문제일 수 있습니다. 화면을 초기화하거나 새로고침해 주세요.
            </p>
          </div>

          {this.state.error && (
            <div className="w-full max-w-xl bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
              <span className="font-bold text-slate-400 block mb-1">오류 메시지:</span>
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Home className="w-4 h-4" />
              <span>화면 초기화</span>
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>페이지 새로고침</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

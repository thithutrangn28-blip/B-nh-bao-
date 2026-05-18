import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Đã xảy ra lỗi không mong muốn.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error) {
          errorMessage = `Lỗi Firestore (${parsedError.operationType}): ${parsedError.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-md w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-stone-800">Rất tiếc! Đã có lỗi xảy ra</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-8 py-3 bg-[#DB2777] text-white rounded-full font-bold hover:bg-[#BE185D] transition-all shadow-lg shadow-[#DB2777]/20"
            >
              <RefreshCcw size={18} />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

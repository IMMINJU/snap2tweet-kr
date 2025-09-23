interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
  submessage?: string;
}

export function LoadingOverlay({ isVisible, message, submessage }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4 px-4">
        {/* Minimal Spinner */}
        <div className="w-8 h-8 mx-auto">
          <div className="w-full h-full border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>

        {/* Clean Typography */}
        <div className="space-y-1">
          <p className="text-gray-900 font-medium">
            {message}
          </p>
          {submessage && (
            <p className="text-sm text-gray-500">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
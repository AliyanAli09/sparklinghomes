import { FiX } from 'react-icons/fi';

const AdminModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmIcon,
  cancelIcon,
  confirmColor = 'blue',
  cancelColor = 'gray',
  showActions = true
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl'
  };

  const getColorClasses = (color, isButton = false) => {
    const colorMap = {
      blue: isButton ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600',
      green: isButton ? 'bg-green-600 hover:bg-green-700' : 'text-green-600',
      red: isButton ? 'bg-red-600 hover:bg-red-700' : 'text-red-600',
      gray: isButton ? 'bg-gray-600 hover:bg-gray-700' : 'text-gray-600',
      yellow: isButton ? 'bg-yellow-600 hover:bg-yellow-700' : 'text-yellow-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-xl shadow-2xl transform transition-all`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>

            {/* Action Buttons */}
            {showActions && (confirmText || cancelText) && (
              <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                {cancelText && (
                  <button
                    onClick={onCancel || onClose}
                    className={`px-4 py-2 text-white ${getColorClasses(cancelColor, true)} rounded-lg transition-colors flex items-center`}
                  >
                    {cancelIcon}
                    {cancelText}
                  </button>
                )}
                {confirmText && (
                  <button
                    onClick={onConfirm}
                    className={`px-4 py-2 text-white ${getColorClasses(confirmColor, true)} rounded-lg transition-colors flex items-center`}
                  >
                    {confirmIcon}
                    {confirmText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminModal;

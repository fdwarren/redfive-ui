import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isProcessing = false,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isProcessing) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'bi-exclamation-triangle-fill text-danger',
          confirmBtn: 'btn-danger'
        };
      case 'warning':
        return {
          icon: 'bi-exclamation-triangle-fill text-warning',
          confirmBtn: 'btn-warning'
        };
      case 'primary':
        return {
          icon: 'bi-question-circle-fill text-primary',
          confirmBtn: 'btn-primary'
        };
      default:
        return {
          icon: 'bi-exclamation-triangle-fill text-danger',
          confirmBtn: 'btn-danger'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              <i className={`bi ${variantClasses.icon} me-2`}></i>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={isProcessing}
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${variantClasses.confirmBtn}`}
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

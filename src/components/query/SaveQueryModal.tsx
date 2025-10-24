import React, { useState, useEffect } from 'react';

interface SaveQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; isPublic: boolean }) => void;
  defaultName: string;
  isSaving?: boolean;
}

const SaveQueryModal: React.FC<SaveQueryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName,
  isSaving = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setDescription('');
      setIsPublic(false);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), description: description.trim(), isPublic });
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-save me-2"></i>
              Save Query
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={isSaving}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="queryName" className="form-label">
                  Query Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="queryName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for your query"
                  required
                  disabled={isSaving}
                  autoFocus
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="queryDescription" className="form-label">
                  Description
                </label>
                <textarea
                  className="form-control"
                  id="queryDescription"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of what this query does"
                  disabled={isSaving}
                />
              </div>
              
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isSaving}
                />
                <label className="form-check-label" htmlFor="isPublic">
                  <i className="bi bi-globe me-1"></i>
                  Make this query public
                </label>
                <div className="form-text">
                  Public queries can be seen and used by other users
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!name.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Save Query
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaveQueryModal;


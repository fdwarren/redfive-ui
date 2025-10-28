import React, { useState } from 'react';
import { useChartState } from '../../hooks/useGlobalState';
import type { ChartSettings } from '../../services/GlobalContext';

interface ChartTemplateManagerProps {
  currentConfig?: ChartSettings;
  tabId?: string;
  onTemplateApplied?: () => void;
}

const ChartTemplateManager: React.FC<ChartTemplateManagerProps> = ({
  currentConfig,
  tabId,
  onTemplateApplied
}) => {
  const { 
    chartState, 
    saveChartTemplate, 
    deleteChartTemplate, 
    applyChartTemplate 
  } = useChartState();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTemplate = async () => {
    if (!currentConfig || !templateName.trim()) return;

    setIsSaving(true);
    try {
      const templateId = saveChartTemplate(templateName, templateDescription, currentConfig);
      console.log('Template saved with ID:', templateId);
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    if (tabId) {
      applyChartTemplate(templateId, tabId);
      if (onTemplateApplied) {
        onTemplateApplied();
      }
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this chart template?')) {
      deleteChartTemplate(templateId);
    }
  };

  return (
    <div className="chart-template-manager">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Chart Templates</h6>
        <button
          className="btn btn-sm"
          style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
          onClick={() => setShowSaveDialog(true)}
          disabled={!currentConfig}
          title="Save current configuration as template"
        >
          <i className="bi bi-save me-1"></i>Save Template
        </button>
      </div>

      {/* Saved Templates List */}
      <div className="templates-list">
        {chartState.savedTemplates.length === 0 ? (
          <div className="text-center text-muted py-3">
            <i className="bi bi-file-earmark-bar-graph fs-4 mb-2"></i>
            <div className="small">No saved templates</div>
          </div>
        ) : (
          chartState.savedTemplates.map((template) => (
            <div key={template.id} className="template-item border rounded p-2 mb-2">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="fw-bold small">{template.name}</div>
                  {template.description && (
                    <div className="text-muted small">{template.description}</div>
                  )}
                  <div className="text-muted small">
                    {template.settings.chart_type} • {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleApplyTemplate(template.id)}
                    disabled={!tabId}
                    title="Apply this template"
                  >
                    <i className="bi bi-arrow-down-circle"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete template"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveDialog && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Save Chart Template</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSaveDialog(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Template Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    maxLength={50}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Description (optional)</label>
                  <textarea
                    className="form-control form-control-sm"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Describe this chart configuration"
                    rows={2}
                    maxLength={200}
                  />
                </div>
                {currentConfig && (
                  <div className="small text-muted">
                    <strong>Current Config:</strong> {currentConfig.chart_type} chart
                    {currentConfig.x_key && ` with ${currentConfig.x_key}`}
                    {currentConfig.y_key && ` vs ${currentConfig.y_key}`}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowSaveDialog(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: '#aa0000', borderColor: '#aa0000', color: 'white' }}
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-1"></i>Save Template
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTemplateManager;


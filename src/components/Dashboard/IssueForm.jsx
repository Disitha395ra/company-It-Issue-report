import { useState, useRef } from 'react';
import { ISSUE_TYPES, getIssueIcon } from '../../utils/helpers';
import { uploadImage } from '../../services/imageUpload';
import LoadingSpinner from '../UI/LoadingSpinner';
import './IssueForm.css';

export default function IssueForm({ onSubmit, submitting, error, success, clearMessages, hasActiveIssue }) {
    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [dragging, setDragging] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const fileInputRef = useRef(null);

    const validate = () => {
        const errors = {};
        if (!issueType) errors.issueType = 'Please select an issue type';
        if (!description.trim()) errors.description = 'Please describe the problem';
        else if (description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFileChange = (selectedFile) => {
        if (!selectedFile) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(selectedFile.type)) {
            setFieldErrors((p) => ({ ...p, file: 'Only JPG, PNG, GIF, or WebP images allowed' }));
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setFieldErrors((p) => ({ ...p, file: 'File size must be under 5MB' }));
            return;
        }

        setFile(selectedFile);
        setFieldErrors((p) => ({ ...p, file: '' }));

        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(selectedFile);
    };

    const removeFile = () => {
        setFile(null);
        setPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileChange(droppedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (clearMessages) clearMessages();

        if (!validate()) return;

        try {
            let screenshotUrl = '';
            if (file) {
                setUploadingImage(true);
                screenshotUrl = await uploadImage(file);
                setUploadingImage(false);
            }

            await onSubmit({
                issueType,
                description: description.trim(),
                screenshotUrl,
            });

            // Reset form on success
            setIssueType('');
            setDescription('');
            removeFile();
        } catch (err) {
            setUploadingImage(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isLoading = submitting || uploadingImage;
    const isBlocked = hasActiveIssue;

    return (
        <div className="issue-form-card" id="issue-form">
            <div className="issue-form-header">
                <h3>📝 Submit New Issue</h3>
                <p>Fill in the details below and our IT team will assist you shortly.</p>
            </div>

            <form className="issue-form-body" onSubmit={handleSubmit} noValidate>
                {/* Success/Error Messages */}
                {success && (
                    <div className="form-message success">
                        ✅ {success}
                    </div>
                )}
                {error && (
                    <div className="form-message error">
                        ❌ {error}
                    </div>
                )}

                {/* Issue Type */}
                <div className="form-group">
                    <label className="form-label" htmlFor="issue-type">
                        <span className="form-label-icon">🏷️</span>
                        Issue Type
                    </label>
                    <select
                        id="issue-type"
                        className={`form-select ${!issueType ? 'placeholder' : ''} ${fieldErrors.issueType ? 'error' : ''}`}
                        value={issueType}
                        onChange={(e) => {
                            setIssueType(e.target.value);
                            if (fieldErrors.issueType) setFieldErrors((p) => ({ ...p, issueType: '' }));
                        }}
                        disabled={isLoading || isBlocked}
                    >
                        <option value="" disabled>Select issue type...</option>
                        {ISSUE_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {getIssueIcon(type)} {type}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.issueType && (
                        <div className="form-error">⚠ {fieldErrors.issueType}</div>
                    )}
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="form-label" htmlFor="description">
                        <span className="form-label-icon">📄</span>
                        Problem Description
                    </label>
                    <textarea
                        id="description"
                        className={`form-textarea ${fieldErrors.description ? 'error' : ''}`}
                        placeholder="Describe your issue in detail. Include any error messages, when it started, and what you were doing when the problem occurred..."
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            if (fieldErrors.description) setFieldErrors((p) => ({ ...p, description: '' }));
                        }}
                        maxLength={1000}
                        disabled={isLoading || isBlocked}
                    />
                    <div className="form-char-count">{description.length}/1000</div>
                    {fieldErrors.description && (
                        <div className="form-error">⚠ {fieldErrors.description}</div>
                    )}
                </div>

                {/* File Upload */}
                <div className="form-group">
                    <label className="form-label">
                        <span className="form-label-icon">📸</span>
                        Screenshot (Optional)
                    </label>

                    {!file ? (
                        <div
                            className={`file-upload-area ${dragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="file-upload-input"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => handleFileChange(e.target.files[0])}
                                id="screenshot-upload"
                                disabled={isLoading || isBlocked}
                            />
                            <div className="file-upload-icon">📁</div>
                            <div className="file-upload-text">
                                Drop your screenshot here or click to browse
                            </div>
                            <div className="file-upload-hint">
                                JPG, PNG, GIF, or WebP • Max 5MB
                            </div>
                        </div>
                    ) : (
                        <div className="file-preview">
                            <img src={preview} alt="Preview" />
                            <div className="file-preview-info">
                                <div className="file-preview-name">{file.name}</div>
                                <div className="file-preview-size">{formatFileSize(file.size)}</div>
                            </div>
                            <button type="button" className="file-preview-remove" onClick={removeFile} aria-label="Remove file">
                                ✕
                            </button>
                        </div>
                    )}

                    {fieldErrors.file && (
                        <div className="form-error">⚠ {fieldErrors.file}</div>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading || isBlocked}
                    id="submit-issue-button"
                >
                    {isBlocked ? (
                        <>
                            🔒 You can submit 1 issue at a time
                        </>
                    ) : isLoading ? (
                        <>
                            <LoadingSpinner small />
                            {uploadingImage ? 'Uploading screenshot...' : 'Submitting...'}
                        </>
                    ) : (
                        <>
                            Submit Issue
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13" />
                                <path d="M22 2L15 22 11 13 2 9z" />
                            </svg>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

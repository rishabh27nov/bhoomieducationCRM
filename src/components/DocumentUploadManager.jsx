import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  FolderOpen,
  File,
  Plus,
  ShieldCheck,
  UserCheck,
  Sparkles,
  X
} from 'lucide-react';
import { downloadDocumentFile } from '../utils/pdfGenerator';

const INITIAL_DOCUMENTS = [
  {
    id: 'DOC-101',
    title: 'Staff Identity Proof - Supriya',
    fileName: 'Supriya_Aadhaar_Card.pdf',
    category: 'Employee Records',
    uploadedBy: 'Supriya',
    uploadDate: '2026-08-10 10:30 AM',
    size: '1.4 MB',
    fileType: 'pdf',
    status: 'Verified'
  },
  {
    id: 'DOC-102',
    title: 'Faculty Appointment Letter - Rishabh',
    fileName: 'Rishabh_Yadav_OfferLetter.pdf',
    category: 'Offer Letter',
    uploadedBy: 'System Admin',
    uploadDate: '2026-08-08 04:15 PM',
    size: '2.1 MB',
    fileType: 'pdf',
    status: 'Verified'
  },
  {
    id: 'DOC-103',
    title: 'NEET Batch Schedule Q3 2026',
    fileName: 'NEET_Batch_Timetable.docx',
    category: 'Academic Verification',
    uploadedBy: 'Niharika',
    uploadDate: '2026-08-11 11:00 AM',
    size: '850 KB',
    fileType: 'docx',
    status: 'Active'
  },
  {
    id: 'DOC-104',
    title: 'Staff Experience Certificate - Niharika',
    fileName: 'Niharika_Certificates.png',
    category: 'Certificates',
    uploadedBy: 'Niharika',
    uploadDate: '2026-08-05 02:45 PM',
    size: '3.2 MB',
    fileType: 'image',
    status: 'Verified'
  }
];

export default function DocumentUploadManager({ currentUser, employees = [] }) {
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('lakshya_uploaded_documents');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState('');

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Employee Records');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('lakshya_uploaded_documents', JSON.stringify(documents));
  }, [documents]);

  const categories = ['All', 'Employee Records', 'Offer Letter', 'Academic Verification', 'Certificates', 'ID Proof', 'Salary Slip', 'Other'];

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile && !docTitle) {
      alert('Please select a file or enter document title');
      return;
    }

    setIsUploading(true);

    const saveDocumentWithDataUrl = (fileDataUrl = null) => {
      const formattedSize = selectedFile
        ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB'
        : '1.2 MB';

      const fileExt = selectedFile
        ? selectedFile.name.split('.').pop().toLowerCase()
        : 'pdf';

      const newDoc = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        title: docTitle.trim() || selectedFile?.name || 'Untitled Document',
        fileName: selectedFile ? selectedFile.name : `${docTitle.trim().replace(/\s+/g, '_')}.${fileExt}`,
        category: docCategory,
        uploadedBy: currentUser?.name || 'System Admin',
        uploadDate: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }),
        size: formattedSize,
        fileType: ['jpg', 'jpeg', 'png'].includes(fileExt) ? 'image' : fileExt,
        status: 'Verified',
        fileDataUrl: fileDataUrl
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setIsUploading(false);
      setSelectedFile(null);
      setDocTitle('');
      setShowSuccessToast(`Document "${newDoc.title}" uploaded successfully!`);
      setTimeout(() => setShowSuccessToast(''), 4000);
    };

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        saveDocumentWithDataUrl(evt.target.result);
      };
      reader.onerror = () => {
        saveDocumentWithDataUrl(null);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      saveDocumentWithDataUrl(null);
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete document "${title}"?`)) {
      setDocuments(documents.filter((d) => d.id !== id));
      setShowSuccessToast('Document deleted.');
      setTimeout(() => setShowSuccessToast(''), 3000);
    }
  };

  const handleDownload = (doc) => {
    downloadDocumentFile(doc);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Toast notification */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#1b4332',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 9999,
          border: '1px solid #52b788'
        }}>
          <CheckCircle2 size={20} color="#52b788" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{showSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderRadius: 'var(--radius-md)', color: '#1b4332' }}>
              <UploadCloud size={24} color="#1b4332" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Document Upload Hub
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Upload, manage, and store official employee records, identity verification documents, certificates & letters securely.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FolderOpen size={16} color="#52b788" />
            <span>Total Documents: {documents.length}</span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Form Card */}
      <div className="glass-card" style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(82, 183, 136, 0.25)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#52b788" /> Upload New Document
        </h3>

        <form onSubmit={handleUploadSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragOver ? '#1b4332' : 'rgba(82, 183, 136, 0.4)'}`,
              backgroundColor: isDragOver ? 'rgba(82, 183, 136, 0.08)' : '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '160px'
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(82, 183, 136, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1b4332',
              marginBottom: '0.75rem'
            }}>
              <UploadCloud size={24} />
            </div>

            {selectedFile ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b4332' }}>{selectedFile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Drag & drop file here or <span style={{ color: '#2d6a4f', textDecoration: 'underline' }}>Browse</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Supports PDF, DOCX, PNG, JPG (Max 25MB)
                </div>
              </div>
            )}
          </div>

          {/* Document Meta Form Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Document Title / Name *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Supriya Aadhaar Card / Offer Letter"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Document Category *
              </label>
              <select
                className="input-field"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                fontWeight: 700,
                marginTop: '0.25rem'
              }}
            >
              {isUploading ? (
                <>Uploading Document...</>
              ) : (
                <>
                  <UploadCloud size={18} /> Confirm & Upload Document
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                border: selectedCategory === cat ? '1px solid #1b4332' : '1px solid var(--border-color)',
                backgroundColor: selectedCategory === cat ? '#1b4332' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: selectedCategory === cat ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search documents by name or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Documents List Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Document Name & File</th>
              <th>Category</th>
              <th>Uploaded By</th>
              <th>Upload Date</th>
              <th>Size</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <FolderOpen size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <div>No documents found matching criteria</div>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(82, 183, 136, 0.12)',
                        color: '#1b4332'
                      }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                          <code>{doc.fileName}</code>
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{doc.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="badge badge-new" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {doc.category}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      <UserCheck size={14} color="#52b788" />
                      {doc.uploadedBy}
                    </div>
                  </td>

                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {doc.uploadDate}
                  </td>

                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {doc.size}
                  </td>

                  <td>
                    <span className="badge badge-admitted" style={{ fontSize: '0.72rem' }}>
                      <CheckCircle2 size={12} /> {doc.status}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        className="btn-icon"
                        title="Preview Document"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Download Document"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: '#ef4444' }}
                        title="Delete Document"
                        onClick={() => handleDelete(doc.id, doc.title)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(12, 32, 23, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }} onClick={() => setPreviewDoc(null)}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xl)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="#1b4332" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Document Overview</h3>
              </div>
              <button className="btn-icon" onClick={() => setPreviewDoc(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Title</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{previewDoc.title}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{previewDoc.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded By</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{previewDoc.uploadedBy}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload Date</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{previewDoc.uploadDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>File Size</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{previewDoc.size}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filename</div>
                <code style={{ fontSize: '0.85rem', color: '#1b4332', backgroundColor: '#d8f3dc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {previewDoc.fileName}
                </code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => { handleDownload(previewDoc); setPreviewDoc(null); }}>
                <Download size={16} /> Download File
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

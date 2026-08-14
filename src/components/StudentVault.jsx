import React, { useState } from 'react';
import { STUDENT_DOCUMENTS } from '../data/mockData';
import { downloadDocumentFile } from '../utils/pdfGenerator';
import {
  FolderOpen,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Plus,
  ShieldCheck,
  Trash2
} from 'lucide-react';

export default function StudentVault() {
  const [documents, setDocuments] = useState(STUDENT_DOCUMENTS);

  const handleDeleteDocument = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleUploadMock = () => {
    const newDoc = {
      id: `DOC-${documents.length + 1}`,
      studentName: 'Sneha Deshmukh',
      docType: '10th Board Marksheet',
      fileName: 'Sneha_Class10_Marksheet.pdf',
      uploadedDate: 'Today',
      status: 'Verified',
      size: '1.8 MB'
    };
    setDocuments([newDoc, ...documents]);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Student Academic Vault
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Repository for 10th/12th marksheets, Aadhaar cards, L-SAT scholarship test scorecards & fee receipts
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleUploadMock}>
          <Upload size={18} /> Upload Academic Document
        </button>
      </div>

      {/* Security Banner */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#d8f3dc',
        border: '1px solid #b7e4c7',
        color: '#081c15',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <ShieldCheck size={24} color="#1b4332" />
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Lakshya Student Records Protection:</strong> All student marksheets and scholarship records are stored securely for admission verification.
        </div>
      </div>

      {/* Documents Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Student</th>
              <th>Category</th>
              <th>Date Uploaded</th>
              <th>File Size</th>
              <th>Verification Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f1f5f9', color: 'var(--color-brand-primary)' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.id}</div>
                    </div>
                  </div>
                </td>

                <td style={{ fontWeight: 600 }}>{doc.studentName}</td>

                <td>
                  <span className="badge badge-new" style={{ fontSize: '0.75rem' }}>
                    {doc.docType}
                  </span>
                </td>

                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.uploadedDate}</td>

                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.size}</td>

                <td>
                  <span className={`badge ${doc.status === 'Verified' ? 'badge-admitted' : 'badge-contacted'}`}>
                    {doc.status === 'Verified' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {doc.status}
                  </span>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                    <button className="btn-icon" title="Preview Document">
                      <Eye size={16} />
                    </button>
                    <button className="btn-icon" title="Download" onClick={() => downloadDocumentFile(doc)}>
                      <Download size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      style={{ color: '#ef4444' }}
                      title="Delete Document"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

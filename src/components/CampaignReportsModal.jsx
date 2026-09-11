import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { jsPDF } from 'jspdf';
import { X, FileText, CheckCircle2, XCircle, Search, Clock, Calendar, Download, CheckSquare } from 'lucide-react';

export default function CampaignReportsModal({ onClose, onRetryFailed, onResumePending }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogIds, setSelectedLogIds] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';
      const res = await fetch(`${FIREBASE_URL}/whatsappCampaignLogs.json`);
      const data = await res.json();
      
      if (data) {
        // Firebase might return an object or array depending on keys.
        // We know we used PUT with string IDs, so it should be an object mapping ID -> log.
        const logArray = Object.values(data).filter(Boolean);
        // Sort by timestamp descending (newest first)
        logArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(logArray);
      }
    } catch (err) {
      console.error('Failed to fetch campaign logs', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => 
    log.template?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.campaignType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFilteredSelected = filteredLogs.length > 0 && filteredLogs.every(log => selectedLogIds.includes(log.id));
  const toggleLogSelection = (id) => setSelectedLogIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const toggleAllFiltered = () => setSelectedLogIds(current => allFilteredSelected
    ? current.filter(id => !filteredLogs.some(log => log.id === id))
    : [...new Set([...current, ...filteredLogs.map(log => log.id)])]);

  const safeFilename = (value) => String(value || 'campaign-report')
    .replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

  const downloadPdf = (reports, filename) => {
    if (!reports.length) return;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 42;
    let y = margin;
    const ensureSpace = (height = 18) => {
      if (y + height <= pageHeight - margin) return;
      pdf.addPage();
      y = margin;
    };
    const line = (text, { size = 9, color = [51, 65, 85], indent = 0, bold = false } = {}) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      pdf.splitTextToSize(String(text || '-'), pageWidth - margin * 2 - indent).forEach(part => {
        ensureSpace(size + 5);
        pdf.text(part, margin + indent, y);
        y += size + 5;
      });
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text('WhatsApp Campaign Delivery Report', margin, y);
    y += 22;
    line(`Downloaded: ${formatDate(new Date().toISOString())}`, { size: 8, color: [100, 116, 139] });
    y += 8;

    [...reports].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach((report, reportIndex) => {
      ensureSpace(80);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 16;
      line(`Date: ${formatDate(report.timestamp)}`, { size: 12, color: [15, 23, 42], bold: true });
      line(`Template: ${report.template || 'Unknown'}  |  Type: ${report.campaignType || 'Unknown'}${report.cycleName ? `  |  Cycle: ${report.cycleName}` : ''}`);
      line(`Target: ${report.targetAudience || 0}   Sent: ${report.successfulCount || 0}   Failed: ${report.failedCount || 0}`, { bold: true });

      const successful = report.successfulLeads || [];
      if (successful.length) {
        y += 4;
        line(`Sent to (${successful.length})`, { size: 10, color: [21, 128, 61], bold: true });
        successful.forEach((lead, index) => line(`${index + 1}. ${lead.name || 'Unknown'} — ${lead.phone || 'N/A'}`, { indent: 10 }));
      }
      const failed = report.failedLeads || [];
      if (failed.length) {
        y += 4;
        line(`Failed (${failed.length})`, { size: 10, color: [185, 28, 28], bold: true });
        failed.forEach((lead, index) => line(`${index + 1}. ${lead.name || 'Unknown'} — ${lead.phone || 'N/A'}${lead.error ? ` | ${lead.error}` : ''}`, { indent: 10, color: [127, 29, 29] }));
      }
      if (!successful.length && !failed.length) line('Recipient-level list was not stored for this older campaign record.', { size: 8, color: [100, 116, 139] });
      if (reportIndex < reports.length - 1) y += 12;
    });
    pdf.save(`${safeFilename(filename)}.pdf`);
  };

  const getPendingRecipients = (log) => (log.recipientResults || [])
    .filter(recipient => recipient.status === 'pending')
    .map(recipient => ({
      id: recipient.leadId || null,
      leadId: recipient.leadId || null,
      name: recipient.name,
      phone: recipient.sourcePhone || recipient.phone
    }));

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px', width: '90%', maxWidth: selectedLog ? '800px' : '650px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', transition: 'max-width 0.3s ease'
      }}>
        
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
            <FileText size={24} color="#3b82f6" /> 
            {selectedLog ? 'Campaign Details' : 'WhatsApp Campaign Reports'}
          </h2>
          <button className="btn-icon" onClick={() => selectedLog ? setSelectedLog(null) : onClose()}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f8fafc' }}>
          
          {!selectedLog ? (
            // LIST VIEW
            <>
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Search by template name or type..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {!loading && filteredLogs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '-0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} />
                    Select all shown ({filteredLogs.length})
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={selectedLogIds.length === 0}
                    onClick={() => downloadPdf(logs.filter(log => selectedLogIds.includes(log.id)), `whatsapp-campaigns-${new Date().toISOString().slice(0, 10)}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: selectedLogIds.length ? 1 : 0.55 }}
                  >
                    <Download size={14} /> Download selected PDF ({selectedLogIds.length})
                  </button>
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', backgroundColor: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  No campaign logs found. Send a bulk message or automation to see reports here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      style={{ 
                        backgroundColor: '#fff', borderRadius: '8px', padding: '1rem', border: '1px solid #e2e8f0', 
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={selectedLogIds.includes(log.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleLogSelection(log.id)}
                          aria-label={`Select ${log.template} report`}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem', fontSize: '1.05rem' }}>
                          {log.template}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} /> {formatDate(log.timestamp)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {log.campaignType}
                            </span>
                          </span>
                          {log.cycleName && (
                            <span style={{ padding: '2px 6px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              Cycle: {log.cycleName}
                            </span>
                          )}
                        </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '0.5rem', borderRadius: '8px', minWidth: '60px' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{log.successfulCount || 0}</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Sent</div>
                        </div>
                        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.5rem', borderRadius: '8px', minWidth: '60px' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{log.failedCount || 0}</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Failed</div>
                        </div>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Download this report as PDF"
                          onClick={(event) => { event.stopPropagation(); downloadPdf([log], `${log.template}-${new Date(log.timestamp).toISOString().slice(0, 10)}`); }}
                          style={{ color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '7px', padding: '0.45rem' }}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // DETAIL VIEW
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
              
              {/* Header Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>{selectedLog.template}</h3>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', gap: '1rem' }}>
                    <span>Type: <b>{selectedLog.campaignType}</b></span>
                    <span>Date: {formatDate(selectedLog.timestamp)}</span>
                    <span>Total Target: {selectedLog.targetAudience}</span>
                    {selectedLog.cycleName && <span>Cycle: <b>{selectedLog.cycleName}</b></span>}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>
                  &larr; Back to List
                </button>
              </div>

              {selectedLog.status === 'sending' && getPendingRecipients(selectedLog).length > 0 && onResumePending && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>Campaign was interrupted</div>
                    <div style={{ color: '#a16207', fontSize: '0.8rem', marginTop: '0.15rem' }}>{getPendingRecipients(selectedLog).length} students are still pending. Sent students will not be included.</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onResumePending(getPendingRecipients(selectedLog), selectedLog.template, selectedLog.id)} style={{ backgroundColor: '#b45309', whiteSpace: 'nowrap' }}>
                    Resume Remaining
                  </button>
                </div>
              )}

              {/* Failed Section */}
              {selectedLog.failedLeads && selectedLog.failedLeads.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', margin: 0 }}>
                      <XCircle size={18} /> Failed Deliveries ({selectedLog.failedCount})
                    </h4>
                    {onRetryFailed && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onRetryFailed(selectedLog.failedLeads, selectedLog.template)}
                        style={{ backgroundColor: '#dc2626', whiteSpace: 'nowrap' }}
                      >
                        Retry Failed ({selectedLog.failedLeads.length})
                      </button>
                    )}
                  </div>
                  <div style={{ border: '1px solid #fecaca', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead style={{ backgroundColor: '#fef2f2', color: '#991b1b', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #fecaca' }}>Student Name</th>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #fecaca' }}>Phone</th>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #fecaca' }}>Error Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLog.failedLeads.map((lead, idx) => (
                          <tr key={idx} style={{ backgroundColor: '#fff', borderBottom: '1px solid #fecaca' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{lead.name || 'Unknown'}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{lead.phone}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#b91c1c', fontSize: '0.85rem' }}>{lead.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Section */}
              {selectedLog.successfulLeads && selectedLog.successfulLeads.length > 0 && (
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', margin: '0 0 1rem 0' }}>
                    <CheckCircle2 size={18} /> Successful Deliveries ({selectedLog.successfulCount})
                  </h4>
                  <div style={{ border: '1px solid #b7e4c7', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead style={{ backgroundColor: '#f0fdf4', color: '#166534', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #b7e4c7' }}>Student Name</th>
                          <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #b7e4c7' }}>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLog.successfulLeads.map((lead, idx) => (
                          <tr key={idx} style={{ backgroundColor: '#fff', borderBottom: '1px solid #b7e4c7' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{lead.name || 'Unknown'}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{lead.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}

import React, { useState } from 'react';
import { INITIAL_TASKS, COUNSELORS } from '../data/mockData';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  Trash2,
  X,
  Bell,
  Search
} from 'lucide-react';

export default function TasksManager({
  tasks = [],
  setTasks,
  logActivity,
  counselors = COUNSELORS,
  searchQuery = '',
  currentUser = { role: 'Admin' }
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const isAdmin = currentUser?.role === 'Admin';


  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    student: '',
    counselor: counselors.length > 0 ? counselors[0].name : 'Ananya Sharma',
    dueDate: todayStr,
    dueTime: '16:00',
    priority: 'High',
    type: 'Follow-up Call'
  });

  const toggleTask = (id) => {
    const targetTask = tasks.find(t => t.id === id);
    const nextCompleted = !targetTask?.completed;

    if (setTasks) {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: nextCompleted } : t));
    }

    if (logActivity && targetTask) {
      logActivity(
        nextCompleted ? 'Task Marked Completed' : 'Task Marked Pending',
        `Task "${targetTask.title}" status updated for student ${targetTask.student}`
      );
    }
  };

  const deleteTask = (id) => {
    const targetTask = tasks.find(t => t.id === id);
    if (window.confirm('Are you sure you want to delete this task?')) {
      if (setTasks) {
        setTasks(tasks.filter(t => t.id !== id));
      }
      if (logActivity && targetTask) {
        logActivity('Task Deleted', `Deleted task: "${targetTask.title}"`);
      }
    }
  };

  const handleSaveTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !newTaskForm.student.trim()) {
      alert('Please fill in Task Title and Student Name.');
      return;
    }

    const newTask = {
      id: `TSK-${100 + tasks.length + 1}`,
      title: newTaskForm.title.trim(),
      student: newTaskForm.student.trim(),
      counselor: newTaskForm.counselor,
      dueDate: newTaskForm.dueDate,
      dueTime: newTaskForm.dueTime,
      priority: newTaskForm.priority,
      type: newTaskForm.type,
      completed: false
    };

    if (setTasks) {
      setTasks([newTask, ...tasks]);
    }

    if (logActivity) {
      logActivity(
        'New Task Scheduled with Reminder Notification',
        `Scheduled task for ${newTask.counselor}: "${newTask.title}" on date ${newTask.dueDate} at ${newTask.dueTime}`
      );
    }

    setNewTaskForm({
      title: '',
      student: '',
      counselor: counselors.length > 0 ? counselors[0].name : 'Ananya Sharma',
      dueDate: todayStr,
      dueTime: '16:00',
      priority: 'High',
      type: 'Follow-up Call'
    });
    setIsModalOpen(false);
  };

  // Filter tasks dynamically using searchQuery from navbar
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      task.title.toLowerCase().includes(query) ||
      task.student.toLowerCase().includes(query) ||
      task.counselor.toLowerCase().includes(query) ||
      task.type.toLowerCase().includes(query) ||
      task.priority.toLowerCase().includes(query)
    );
  });

  // Calculate pending tasks due today or upcoming
  const urgentReminders = tasks.filter(
    (t) => !t.completed && (t.dueDate === 'Today' || t.dueDate === todayStr || t.priority === 'High' || t.priority === 'Urgent')
  );

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Counselor Tasks & Daily Reminders
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Schedule customized date & time follow-up reminders with automatic counselor notifications
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Schedule Task
        </button>
      </div>

      {/* 🔔 Reminder Notification Banner */}
      {urgentReminders.length > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#fffbe6',
            border: '1px solid #fef08a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: '#fde047', color: '#854d0e' }}>
              <Bell size={20} className="pulse-glow" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#854d0e' }}>
                🔔 Active Reminder Notification: {urgentReminders.length} Scheduled Tasks Require Follow-up Today!
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a16207' }}>
                Staff members assigned will receive reminders for scheduled student calls and counseling sessions.
              </div>
            </div>
          </div>
          <span className="badge badge-rejected" style={{ fontSize: '0.75rem' }}>
            {urgentReminders.length} Due Tasks
          </span>
        </div>
      )}

      {/* Search Filter Status */}
      {searchQuery && (
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brand-emerald)' }}>
          🔍 Filtered results for "{searchQuery}": {filteredTasks.length} task(s) found
        </div>
      )}

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tasks found matching your search. Try adjusting your query or schedule a new task.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="glass-card"
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: task.completed ? 0.6 : 1,
                transition: 'all 0.2s ease',
                borderLeft: task.priority === 'Urgent' || task.priority === 'High' ? '4px solid #ef4444' : '4px solid #3b82f6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-brand-emerald)' }}
                />

                <div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    textDecoration: task.completed ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span>Student: <strong>{task.student}</strong></span>
                    <span>•</span>
                    <span>Action: <strong>{task.type}</strong></span>
                    <span>•</span>
                    <span>Counselor: <strong>{task.counselor}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${task.priority === 'High' || task.priority === 'Urgent' ? 'badge-rejected' : 'badge-contacted'}`}>
                  {task.priority} Priority
                </span>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={15} color="var(--color-brand-emerald)" />
                  <span>📅 {task.dueDate} at {task.dueTime}</span>
                </div>

                {isAdmin && (
                  <button
                    className="btn-icon"
                    style={{ color: '#ef4444' }}
                    title="Delete Task (Admin Only)"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>


      {/* Schedule Task Modal with Customized Date & Time Pickers */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(12, 32, 23, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0c2017 0%, #143829 100%)',
              color: '#ffffff',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <Calendar size={20} color="#3a8a66" /> Schedule Task & Set Reminder Date
              </div>
              <button
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
                style={{ color: '#ffffff', opacity: 0.8 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTaskSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Task Subject / Action Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call regarding NEET Class 11 Demo Class..."
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Gupta"
                    value={newTaskForm.student}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, student: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Assign Counselor / Staff *</label>
                  <select
                    className="form-select"
                    value={newTaskForm.counselor}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, counselor: e.target.value })}
                  >
                    {counselors.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Action Type</label>
                  <select
                    className="form-select"
                    value={newTaskForm.type}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })}
                  >
                    <option value="Follow-up Call">Follow-up Call</option>
                    <option value="In-person Demo Session">In-person Demo Session</option>
                    <option value="Scholarship Audit">Scholarship Audit</option>
                    <option value="Fee Collection">Fee Collection</option>
                    <option value="Material & ID Distribution">Material & ID Distribution</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Priority Level</label>
                  <select
                    className="form-select"
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Normal">Normal Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>📅 Customized Reminder Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>⏰ Reminder Time *</label>
                  <input
                    type="time"
                    required
                    value={newTaskForm.dueTime}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueTime: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



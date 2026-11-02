import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Clock } from 'lucide-react';
import { Task, Project, Employee, Priority, TaskStatus } from '../types';
import { createTask, updateTask } from '../api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  projects: Project[];
  employees: Employee[];
  defaultProjectId?: string;
  accessKey?: string;
  taskToEdit?: Task | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
  employees,
  defaultProjectId,
  accessKey,
  taskToEdit,
}) => {
  if (!isOpen) return null;

  const [projectId, setProjectId] = useState(
    taskToEdit?.project_id || defaultProjectId || projects[0]?.id || ''
  );
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [assignedTo, setAssignedTo] = useState(taskToEdit?.assigned_to || '');
  const [priority, setPriority] = useState<Priority>(taskToEdit?.priority || 'Medium');
  const [deadline, setDeadline] = useState(taskToEdit?.deadline || '');
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'Not Started');
  const [progress, setProgress] = useState<number>(taskToEdit?.progress || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setProjectId(taskToEdit.project_id);
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setAssignedTo(taskToEdit.assigned_to || '');
      setPriority(taskToEdit.priority);
      setDeadline(taskToEdit.deadline || '');
      setStatus(taskToEdit.status);
      setProgress(taskToEdit.progress);
    } else {
      setProjectId(defaultProjectId || projects[0]?.id || '');
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('Medium');
      setDeadline('');
      setStatus('Not Started');
      setProgress(0);
    }
  }, [taskToEdit, defaultProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Please select a project for this task.');
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      setError('Task title is required (minimum 3 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        project_id: projectId,
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo || undefined,
        priority,
        deadline: deadline || undefined,
        status,
        progress,
      };

      if (taskToEdit) {
        const res = await updateTask(taskToEdit.id, payload, accessKey);
        onSuccess(res.task);
      } else {
        const res = await createTask(payload, accessKey);
        onSuccess(res.task);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0f1d] rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {taskToEdit ? 'Edit Operational Task' : 'Create New Project Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-semibold text-slate-200">
              Parent Project <span className="text-cyan-400">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.department_name || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-200">
              Task Title <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement mTLS handshake session caching & token renewal"
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-200">Task Scope & Acceptance Criteria</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail required engineering specs, security controls or test cases..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">Assign To Team Member</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation.substring(0, 20)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">
                Deadline <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

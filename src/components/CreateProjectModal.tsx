import React, { useState, useEffect } from 'react';
import { X, Briefcase, Plus, Check } from 'lucide-react';
import { Project, Department, Employee, Priority, ProjectStatus } from '../types';
import { createProject, updateProject } from '../api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  departments: Department[];
  employees: Employee[];
  accessKey?: string;
  projectToEdit?: Project | null;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments,
  employees,
  accessKey,
  projectToEdit,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(projectToEdit?.name || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [departmentId, setDepartmentId] = useState(projectToEdit?.department_id || departments[0]?.id || '');
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>(
    projectToEdit?.assigned_employee_ids || []
  );
  const [startDate, setStartDate] = useState(
    projectToEdit?.start_date || new Date().toISOString().split('T')[0]
  );
  const [targetDate, setTargetDate] = useState(projectToEdit?.target_date || '');
  const [priority, setPriority] = useState<Priority>(projectToEdit?.priority || 'Medium');
  const [status, setStatus] = useState<ProjectStatus>(projectToEdit?.status || 'Planning');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description);
      setDepartmentId(projectToEdit.department_id || departments[0]?.id || '');
      setAssignedEmployeeIds(projectToEdit.assigned_employee_ids || []);
      setStartDate(projectToEdit.start_date);
      setTargetDate(projectToEdit.target_date || '');
      setPriority(projectToEdit.priority);
      setStatus(projectToEdit.status);
    } else {
      setName('');
      setDescription('');
      setDepartmentId(departments[0]?.id || '');
      setAssignedEmployeeIds([]);
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetDate('');
      setPriority('Medium');
      setStatus('Planning');
    }
  }, [projectToEdit, departments]);

  const toggleEmployeeAssignment = (empId: string) => {
    setAssignedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Project name is required (minimum 2 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        department_id: departmentId || undefined,
        assigned_employee_ids: assignedEmployeeIds,
        start_date: startDate,
        target_date: targetDate || undefined,
        priority,
        status,
      };

      if (projectToEdit) {
        const res = await updateProject(projectToEdit.id, payload, accessKey);
        onSuccess(res.project);
      } else {
        const res = await createProject(payload, accessKey);
        onSuccess(res.project);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
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
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {projectToEdit ? 'Edit Enterprise Project' : 'Create New Enterprise Project'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-semibold text-slate-200">
              Project Title <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ZeroTrust Gateway or ThreatIntel Engine"
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-200">Short Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project goals, scope, and technical deliverables..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">Priority Level</label>
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
              <label className="block font-semibold text-slate-200">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-200">
                Target Deadline <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-200">Initial Project Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
            >
              <option value="Planning">Planning</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Assigned Employees Checkboxes */}
          <div className="space-y-1.5 pt-1">
            <label className="block font-semibold text-slate-200">
              Assign Team Members ({assignedEmployeeIds.length} assigned)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900/60 border border-slate-800 rounded-lg">
              {employees.map((emp) => {
                const isSelected = assignedEmployeeIds.includes(emp.id);
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => toggleEmployeeAssignment(emp.id)}
                    className={`p-2 rounded-md border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-xs">{emp.name}</span>
                      <span className="text-[10px] text-slate-500">{emp.designation.substring(0, 24)}...</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
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
              {isSubmitting ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Briefcase,
  CheckSquare,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import { Department } from '../types';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api';

interface DepartmentsPageProps {
  accessKey?: string;
  isManager: boolean;
  onSelectDepartmentFilter: (deptId: string) => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  accessKey,
  isManager,
  onSelectDepartmentFilter,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openAddModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Department) => {
    setEditingDept(d);
    setName(d.name);
    setCode(d.code);
    setDescription(d.description);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Department name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDept) {
        await updateDepartment(
          editingDept.id,
          { name: name.trim(), code: code.trim(), description: description.trim() },
          accessKey
        );
      } else {
        await createDepartment(
          { name: name.trim(), code: code.trim(), description: description.trim() },
          accessKey
        );
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (d: Department) => {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;

    try {
      await deleteDepartment(d.id, accessKey);
      loadDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Department Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize company initiatives and staff into functional units with computed deliverables progress.
          </p>
        </div>

        {isManager && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Department</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-[#0e1628] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                    {dept.code}
                  </span>

                  {isManager && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Edit department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/50"
                        title="Delete department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-sm text-white">{dept.name}</h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {dept.description || 'No description added.'}
                </p>
              </div>

              {/* Progress and Projects Metrics */}
              <div className="space-y-2 pt-3 border-t border-slate-800/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Average Progress</span>
                  <span className="font-mono tabular-nums font-bold text-cyan-400">
                    {dept.avg_progress ?? 0}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${dept.avg_progress ?? 0}%` }}
                    className="h-full bg-cyan-400 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{dept.project_count ?? 0} projects</span>
                  <span>{dept.task_count ?? 0} tasks</span>
                </div>

                <button
                  onClick={() => onSelectDepartmentFilter(dept.id)}
                  className="w-full mt-2 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-cyan-400 text-[11px] font-semibold text-center cursor-pointer transition-colors"
                >
                  View Department Projects →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-semibold text-slate-200">Department Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Threat Intelligence"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-200">Code / Acronym</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. TI"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 uppercase font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-200">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline department scope and operations..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

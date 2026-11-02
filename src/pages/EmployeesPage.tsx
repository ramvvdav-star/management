import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  KeyRound,
  Edit2,
  Trash2,
  X,
  Shield,
  Briefcase,
} from 'lucide-react';
import { Employee, Department, UserRole, EmployeeStatus } from '../types';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api';

interface EmployeesPageProps {
  departments: Department[];
  accessKey?: string;
  isManager: boolean;
  currentEmployeeId?: string;
  onSelectEmployeeSession: (key: string) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  departments,
  accessKey,
  isManager,
  currentEmployeeId,
  onSelectEmployeeSession,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit Employee Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Employee');
  const [formStatus, setFormStatus] = useState<EmployeeStatus>('Active');
  const [formAccessKey, setFormAccessKey] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormEmployeeId(`ESI-${1000 + employees.length + 1}`);
    setFormDepartmentId(departments[0]?.id || '');
    setFormDesignation('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormRole('Employee');
    setFormStatus('Active');
    setFormAccessKey(`${1000 + employees.length + 1}`);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmployeeId(emp.employee_id);
    setFormDepartmentId(emp.department_id || departments[0]?.id || '');
    setFormDesignation(emp.designation);
    setFormJoiningDate(emp.joining_date || '');
    setFormRole(emp.role);
    setFormStatus(emp.status);
    setFormAccessKey('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError('Employee name is required (minimum 2 characters).');
      return;
    }
    if (!formEmployeeId.trim()) {
      setFormError('Employee ID is required.');
      return;
    }
    if (!formDesignation.trim()) {
      setFormError('Designation is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        await updateEmployee(
          editingEmployee.id,
          {
            name: formName.trim(),
            employee_id: formEmployeeId.trim(),
            department_id: formDepartmentId || undefined,
            designation: formDesignation.trim(),
            joining_date: formJoiningDate || undefined,
            role: formRole,
            status: formStatus,
            access_key: formAccessKey ? formAccessKey.trim() : undefined,
          },
          accessKey
        );
      } else {
        await createEmployee(
          {
            name: formName.trim(),
            employee_id: formEmployeeId.trim(),
            department_id: formDepartmentId || undefined,
            designation: formDesignation.trim(),
            joining_date: formJoiningDate || undefined,
            role: formRole,
            status: formStatus,
            access_key: formAccessKey.trim() || '1234',
          },
          accessKey
        );
      }

      setIsModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!window.confirm(`Are you sure you want to remove employee "${emp.name}"?`)) return;

    try {
      await deleteEmployee(emp.id, accessKey);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to remove employee');
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.department_name && e.department_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employee Directory & Roles</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Initial company team (Hardik, Abhishek, Kaushik, Himanshu) with real-time task contributions and access permissions.
          </p>
        </div>

        {isManager && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, department or designation..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Employee Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => {
            const isCurrentActive = emp.id === currentEmployeeId;
            return (
              <div
                key={emp.id}
                className={`bg-[#0e1628] border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all ${
                  isCurrentActive ? 'border-cyan-500/80 ring-1 ring-cyan-500/40' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-base text-white shadow-md">
                      {emp.name.charAt(0)}
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          emp.role === 'Manager'
                            ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60'
                            : 'text-slate-300 bg-slate-900 border border-slate-800'
                        }`}
                      >
                        {emp.role}
                      </span>

                      {isManager && (
                        <>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Edit employee details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/50"
                            title="Remove employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{emp.name}</span>
                      {isCurrentActive && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">
                          Current
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-cyan-400 font-medium mt-0.5">{emp.designation}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                      <span>{emp.employee_id}</span>
                      <span>·</span>
                      <span>{emp.department_name || 'General'}</span>
                    </div>
                  </div>
                </div>

                {/* Task Metrics */}
                <div className="space-y-2 pt-3 border-t border-slate-800/70 text-xs">
                  <div className="grid grid-cols-3 gap-1 text-center bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tasks</span>
                      <span className="font-bold font-mono tabular-nums text-slate-200">{emp.total_tasks ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Done</span>
                      <span className="font-bold font-mono tabular-nums text-emerald-400">
                        {emp.completed_tasks ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Avg Done</span>
                      <span className="font-bold font-mono tabular-nums text-cyan-400">
                        {emp.avg_progress ?? 0}%
                      </span>
                    </div>
                  </div>

                  {/* Switch to this user */}
                  <button
                    onClick={() => onSelectEmployeeSession(emp.access_key || emp.employee_id)}
                    className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3 h-3 text-cyan-400" />
                    <span>Act as {emp.name}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0f1d] rounded-t-2xl shrink-0">
              <h3 className="text-sm font-bold text-white">
                {editingEmployee ? `Edit Employee (${editingEmployee.name})` : 'Add New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEmployee} className="flex-1 overflow-y-auto p-6 space-y-3.5">
              {formError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-semibold text-slate-200">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">Employee ID</label>
                  <input
                    type="text"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    placeholder="ESI-1005"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">Department</label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-200">Designation / Role Title</label>
                <input
                  type="text"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  placeholder="e.g. Senior Vulnerability Researcher"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">Permission Level</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Employee">Employee (Task Updates)</option>
                    <option value="Manager">Manager (Full Management)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">Passkey / PIN</label>
                  <input
                    type="text"
                    value={formAccessKey}
                    onChange={(e) => setFormAccessKey(e.target.value)}
                    placeholder="e.g. 1005"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

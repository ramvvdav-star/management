import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Timer,
} from 'lucide-react';
import { Project, Task, Employee, Department } from '../types';

interface ReportsPageProps {
  projects: Project[];
  tasks: Task[];
  employees: Employee[];
  departments: Department[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  projects,
  tasks,
  employees,
  departments,
}) => {
  const [reportType, setReportType] = useState<'projects' | 'employees' | 'tasks'>('projects');
  const today = new Date().toISOString().split('T')[0];

  // CSV Export
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (reportType === 'projects') {
      filename = `eSecurityIn_Projects_Report_${today}.csv`;
      headers = [
        'Project Name',
        'Department',
        'Status',
        'Priority',
        'Completion %',
        'Total Tasks',
        'Tasks Done',
        'Tasks Active',
        'Tasks Blocked',
        'Start Date',
        'Target Deadline',
        'Total Hours',
      ];
      rows = projects.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.department_name || ''}"`,
        p.status,
        p.priority,
        p.progress,
        p.total_tasks,
        p.completed_tasks,
        p.in_progress_tasks,
        p.blocked_tasks,
        p.start_date,
        p.target_date || 'N/A',
        p.total_hours,
      ]);
    } else if (reportType === 'employees') {
      filename = `eSecurityIn_Employees_Report_${today}.csv`;
      headers = ['Name', 'Employee ID', 'Department', 'Designation', 'Role', 'Tasks Assigned', 'Tasks Done', 'Avg Progress %', 'Hours Spent'];
      rows = employees.map((e) => [
        `"${e.name}"`,
        `"${e.employee_id}"`,
        `"${e.department_name || ''}"`,
        `"${e.designation}"`,
        e.role,
        e.total_tasks ?? 0,
        e.completed_tasks ?? 0,
        e.avg_progress ?? 0,
        e.total_hours ?? 0,
      ]);
    } else {
      filename = `eSecurityIn_Tasks_Report_${today}.csv`;
      headers = ['Task Title', 'Project', 'Assignee', 'Status', 'Priority', 'Progress %', 'Deadline', 'Hours Spent'];
      rows = tasks.map((t) => [
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.project_name || ''}"`,
        `"${t.assigned_employee_name || 'Unassigned'}"`,
        t.status,
        t.priority,
        t.progress,
        t.deadline || 'N/A',
        t.time_spent,
      ]);
    }

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Excel Export
  const handleExportExcel = () => {
    let content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head>
      <body>
        <h2>eSecurityIn Project Management Report - ${reportType.toUpperCase()}</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table border="1">
    `;

    if (reportType === 'projects') {
      content += `
        <tr style="background:#0f172a;color:#fff;">
          <th>Project</th><th>Department</th><th>Status</th><th>Priority</th><th>Progress</th><th>Total Tasks</th><th>Done</th><th>Hours</th>
        </tr>
        ${projects.map((p) => `<tr><td>${p.name}</td><td>${p.department_name || ''}</td><td>${p.status}</td><td>${p.priority}</td><td>${p.progress}%</td><td>${p.total_tasks}</td><td>${p.completed_tasks}</td><td>${p.total_hours}</td></tr>`).join('')}
      `;
    } else if (reportType === 'employees') {
      content += `
        <tr style="background:#0f172a;color:#fff;">
          <th>Name</th><th>ID</th><th>Department</th><th>Designation</th><th>Role</th><th>Tasks</th><th>Done</th><th>Avg Done</th>
        </tr>
        ${employees.map((e) => `<tr><td>${e.name}</td><td>${e.employee_id}</td><td>${e.department_name || ''}</td><td>${e.designation}</td><td>${e.role}</td><td>${e.total_tasks ?? 0}</td><td>${e.completed_tasks ?? 0}</td><td>${e.avg_progress ?? 0}%</td></tr>`).join('')}
      `;
    } else {
      content += `
        <tr style="background:#0f172a;color:#fff;">
          <th>Task</th><th>Project</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Progress</th><th>Deadline</th>
        </tr>
        ${tasks.map((t) => `<tr><td>${t.title}</td><td>${t.project_name || ''}</td><td>${t.assigned_employee_name || ''}</td><td>${t.status}</td><td>${t.priority}</td><td>${t.progress}%</td><td>${t.deadline || ''}</td></tr>`).join('')}
      `;
    }

    content += `</table></body></html>`;

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eSecurityIn_${reportType}_${today}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Project & Progress Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade performance metrics generated directly from active database records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Report Cadence Selector */}
      <div className="no-print flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setReportType('projects')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            reportType === 'projects' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Projects Portfolio Report ({projects.length})
        </button>
        <button
          onClick={() => setReportType('employees')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            reportType === 'employees' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Staff Contribution Report ({employees.length})
        </button>
        <button
          onClick={() => setReportType('tasks')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            reportType === 'tasks' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Tasks Progress Report ({tasks.length})
        </button>
      </div>

      {/* Document View */}
      <div className="bg-[#0e1628] border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 print:border-black">
          <div>
            <span className="text-xs font-bold text-cyan-400 print:text-black uppercase tracking-wider block">
              eSecurityIn Management Platform
            </span>
            <h1 className="text-xl font-bold text-white print:text-black mt-0.5">
              {reportType === 'projects'
                ? 'Company Projects & Milestone Progress Audit'
                : reportType === 'employees'
                ? 'Employee Deliverables & Task Contribution Report'
                : 'Operational Task Execution & Progress Summary'}
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Date: <strong className="text-slate-200 print:text-black">{today}</strong> | Generated across active database records
            </p>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {reportType === 'projects' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-gray-400">
              <thead className="bg-[#0a0f1d] print:bg-gray-100 border-b border-slate-800 print:border-gray-400 text-slate-400 print:text-black uppercase text-[10px]">
                <tr>
                  <th className="p-3">Project Title</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Tasks Breakdown</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3 text-right">Hours Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-300">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      No projects currently recorded in database.
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-100 print:text-black">{p.name}</td>
                      <td className="p-3 text-slate-400 print:text-black">{p.department_name}</td>
                      <td className="p-3">{p.health_status}</td>
                      <td className="p-3 font-mono font-bold text-cyan-400 print:text-black">{p.progress}%</td>
                      <td className="p-3 text-slate-300 print:text-black">
                        {p.completed_tasks}/{p.total_tasks} completed ({p.blocked_tasks} blocked)
                      </td>
                      <td className="p-3 font-mono text-slate-400 print:text-black">{p.target_date || 'N/A'}</td>
                      <td className="p-3 font-mono text-right font-bold text-slate-200 print:text-black">{p.total_hours}h</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'employees' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-gray-400">
              <thead className="bg-[#0a0f1d] print:bg-gray-100 border-b border-slate-800 print:border-gray-400 text-slate-400 print:text-black uppercase text-[10px]">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Assigned Tasks</th>
                  <th className="p-3">Tasks Done</th>
                  <th className="p-3">Average Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-300">
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3 font-bold text-slate-100 print:text-black">{e.name}</td>
                    <td className="p-3 font-mono text-slate-400 print:text-black">{e.employee_id}</td>
                    <td className="p-3 text-cyan-400 print:text-black">{e.designation}</td>
                    <td className="p-3 text-slate-400 print:text-black">{e.department_name || 'General'}</td>
                    <td className="p-3">{e.role}</td>
                    <td className="p-3 font-mono text-slate-200 print:text-black">{e.total_tasks ?? 0}</td>
                    <td className="p-3 font-mono text-emerald-400 print:text-black">{e.completed_tasks ?? 0}</td>
                    <td className="p-3 font-mono font-bold text-cyan-400 print:text-black">{e.avg_progress ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'tasks' && (
            <table className="w-full text-left text-xs border border-slate-800 print:border-gray-400">
              <thead className="bg-[#0a0f1d] print:bg-gray-100 border-b border-slate-800 print:border-gray-400 text-slate-400 print:text-black uppercase text-[10px]">
                <tr>
                  <th className="p-3">Task Title</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-gray-300">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      No tasks found in database.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="p-3 font-semibold text-slate-100 print:text-black">{t.title}</td>
                      <td className="p-3 text-cyan-400 print:text-black">{t.project_name}</td>
                      <td className="p-3 text-slate-300 print:text-black">{t.assigned_employee_name || 'Unassigned'}</td>
                      <td className="p-3">{t.status}</td>
                      <td className="p-3">{t.priority}</td>
                      <td className="p-3 font-mono font-bold text-cyan-400 print:text-black">{t.progress}%</td>
                      <td className="p-3 font-mono text-slate-400 print:text-black">{t.deadline || 'N/A'}</td>
                      <td className="p-3 font-mono text-right text-slate-200 print:text-black">{t.time_spent}h</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

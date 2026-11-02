import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Calendar,
  Layers,
  FileText,
  User,
  History,
  MessageSquare,
} from 'lucide-react';
import { Task, TaskProgressUpdate, TaskComment, TaskStatus } from '../types';
import { submitTaskProgress, fetchTaskDetails, addTaskComment } from '../api';

interface TaskProgressModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
  accessKey?: string;
  currentEmployeeName?: string;
  onRequireAuth: () => void;
}

export const TaskProgressModal: React.FC<TaskProgressModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
  accessKey,
  currentEmployeeName,
  onRequireAuth,
}) => {
  if (!isOpen || !task) return null;

  const [sliderProgress, setSliderProgress] = useState(task.progress || 0);
  const [workCompleted, setWorkCompleted] = useState('');
  const [workRemaining, setWorkRemaining] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [timeSpent, setTimeSpent] = useState<number>(1);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(task.status);

  const [activeTab, setActiveTab] = useState<'update' | 'history' | 'comments'>('update');
  const [historyUpdates, setHistoryUpdates] = useState<TaskProgressUpdate[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSliderProgress(task.progress || 0);
    setTaskStatus(task.status);
    setWorkCompleted('');
    setWorkRemaining('');
    setChallenges('');
    setNextSteps('');
    setTimeSpent(1);
    loadTaskDetails();
  }, [task.id]);

  const loadTaskDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const data = await fetchTaskDetails(task.id);
      setHistoryUpdates(data.updates || []);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching task details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSliderChange = (newVal: number) => {
    setSliderProgress(newVal);
    if (newVal === 100) setTaskStatus('Completed');
    else if (newVal > 0 && taskStatus === 'Not Started') setTaskStatus('In Progress');
  };

  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accessKey) {
      onRequireAuth();
      return;
    }

    if (!workCompleted.trim()) {
      setErrorMessage('Please describe the work completed in this progress update.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitTaskProgress(
        task.id,
        {
          progress: sliderProgress,
          work_completed: workCompleted.trim(),
          work_remaining: workRemaining.trim(),
          challenges: challenges.trim(),
          next_steps: nextSteps.trim(),
          time_spent: timeSpent,
          status: taskStatus,
        },
        accessKey
      );

      onSuccess(res.task);
      setWorkCompleted('');
      setWorkRemaining('');
      setChallenges('');
      setNextSteps('');
      loadTaskDetails();
      setActiveTab('history');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!accessKey) {
      onRequireAuth();
      return;
    }

    try {
      const res = await addTaskComment(task.id, newComment.trim(), accessKey);
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0f1d] rounded-t-2xl shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                {task.project_name || 'Project Task'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Assigned: {task.assigned_employee_name || 'Unassigned'}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">{task.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-[#0c1322] shrink-0">
          <button
            onClick={() => setActiveTab('update')}
            className={`pb-2.5 px-2 font-medium text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'update'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Update Progress (0-100%)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-2 font-medium text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Progress History ({historyUpdates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`pb-2.5 px-2 font-medium text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({comments.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'update' && (
            <form onSubmit={handleSubmitProgress} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Progress Slider Component */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Current Task Completion</span>
                  <span className="text-xl font-mono tabular-nums font-bold text-cyan-400">
                    {sliderProgress}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sliderProgress}
                  onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex gap-1.5">
                    {[0, 25, 50, 75, 100].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleSliderChange(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                          sliderProgress === preset
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>

                  <span className="font-medium text-slate-300">
                    Auto-Status: <strong className="text-cyan-300">{taskStatus}</strong>
                  </span>
                </div>
              </div>

              {/* Work Completed */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-200">
                  What work was completed? <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="Summarize the code, security reviews, patches or tests executed today..."
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              {/* Work Remaining & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">
                    What remains to be done?
                  </label>
                  <input
                    type="text"
                    value={workRemaining}
                    onChange={(e) => setWorkRemaining(e.target.value)}
                    placeholder="Remaining sub-tasks or edge-cases"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">Next Steps</label>
                  <input
                    type="text"
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    placeholder="Immediate action item for next sprint"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>

              {/* Challenges & Time Spent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>Challenges or Blockers</span>
                    <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="Dependency delays, infrastructure blockers..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-200">Time Spent on this Update</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={timeSpent}
                      onChange={(e) => setTimeSpent(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Submitting as: <strong className="text-slate-200">{currentEmployeeName || 'Staff Member'}</strong>
                </span>

                <div className="flex items-center gap-2">
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
                    {isSubmitting ? 'Recording...' : 'Save Progress Update'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyUpdates.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No progress updates logged for this task yet.</p>
                  <button
                    onClick={() => setActiveTab('update')}
                    className="mt-2 text-cyan-400 hover:underline cursor-pointer"
                  >
                    Log the first progress update →
                  </button>
                </div>
              ) : (
                historyUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{update.employee_name}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {update.previous_progress}% → {update.new_progress}%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(update.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                      {update.work_completed}
                    </p>

                    {update.challenges && (
                      <div className="text-red-300 text-[11px] flex items-start gap-1.5 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-red-400">Blocker:</strong> {update.challenges}
                        </span>
                      </div>
                    )}

                    {update.next_steps && (
                      <div className="text-slate-400 text-[11px]">
                        <strong>Next Steps:</strong> {update.next_steps}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a team comment, note or question..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded-lg cursor-pointer"
                >
                  Comment
                </button>
              </form>

              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-slate-400 text-center py-6 italic">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-200">{c.employee_name}</span>
                        <span className="font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

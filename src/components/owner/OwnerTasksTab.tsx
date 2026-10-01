import React, { useState } from 'react';
import { DailyTask, CurrencyType } from '../../types';
import { ALL_OWNER_TASK_LINKS, getCurrentDayIndex } from '../../data/tasksData';

interface OwnerTasksTabProps {
  tasks: DailyTask[];
  onUpdateTasks: (newTasks: DailyTask[]) => void;
  currency?: CurrencyType;
}

export const OwnerTasksTab: React.FC<OwnerTasksTabProps> = ({
  tasks,
  onUpdateTasks,
  currency = 'PKR'
}) => {
  const currentTodayIndex = getCurrentDayIndex();
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Add / Edit modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<'youtube' | 'telegram' | 'mining' | 'earning'>('youtube');
  const [formDayIndex, setFormDayIndex] = useState<number>(currentTodayIndex);
  const [formTaskNumber, setFormTaskNumber] = useState<1 | 2 | 3>(1);
  const [formRewardPkr, setFormRewardPkr] = useState<number>(10);
  const [formRewardUsd, setFormRewardUsd] = useState<number>(1.00);
  const [formTimerSeconds, setFormTimerSeconds] = useState<number>(12);
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const dayLabels = [
    'Day 1 (Monday)',
    'Day 2 (Tuesday)',
    'Day 3 (Wednesday)',
    'Day 4 (Thursday)',
    'Day 5 (Friday)',
    'Day 6 (Saturday)',
    'Day 7 (Sunday)'
  ];

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedDayFilter !== 'all' && t.dayIndex !== selectedDayFilter) return false;
    if (selectedCategoryFilter !== 'all' && t.category !== selectedCategoryFilter) return false;
    return true;
  });

  const handleOpenAddModal = (seedFromPool?: { name?: string; title?: string; url: string; type?: any; category?: any; description?: string }) => {
    setEditingTask(null);
    if (seedFromPool) {
      setFormTitle(seedFromPool.name || seedFromPool.title || '');
      setFormUrl(seedFromPool.url);
      setFormCategory(seedFromPool.type || seedFromPool.category || 'youtube');
      setFormDescription(seedFromPool.description || 'Complete daily task to earn wallet rewards.');
    } else {
      setFormTitle('');
      setFormUrl('');
      setFormCategory('youtube');
      setFormDescription('');
    }
    setFormDayIndex(selectedDayFilter === 'all' ? currentTodayIndex : selectedDayFilter);
    setFormTaskNumber(1);
    setFormRewardPkr(10);
    setFormRewardUsd(1.00);
    setFormTimerSeconds(12);
    setFormInstructions('Open the link\nEngage for 12 seconds\nReceive 10 PKR / $1.00 USD reward');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (task: DailyTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormUrl(task.url);
    setFormCategory(task.category);
    setFormDayIndex(task.dayIndex);
    setFormTaskNumber(task.taskNumber);
    setFormRewardPkr(task.rewardPkr);
    setFormRewardUsd(task.rewardUsd);
    setFormTimerSeconds(task.timerSeconds);
    setFormDescription(task.description);
    setFormInstructions(task.instructions.join('\n'));
    setIsAddModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    const instructionsArray = formInstructions
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingTask) {
      // Update existing
      const updated = tasks.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            title: formTitle.trim(),
            url: formUrl.trim(),
            category: formCategory,
            dayIndex: formDayIndex,
            taskNumber: formTaskNumber,
            rewardPkr: Number(formRewardPkr) || 10,
            rewardUsd: Number(formRewardUsd) || 1.00,
            timerSeconds: Number(formTimerSeconds) || 12,
            description: formDescription.trim() || 'Complete daily task to earn wallet rewards.',
            instructions: instructionsArray.length > 0 ? instructionsArray : ['Open link', 'Engage for 12 seconds', 'Auto-verify']
          };
        }
        return t;
      });
      onUpdateTasks(updated);
      setFeedback(`Task "${formTitle}" updated successfully!`);
    } else {
      // Add new
      const newTask: DailyTask = {
        id: `task-custom-${Date.now()}`,
        dayIndex: formDayIndex,
        dayName: dayLabels[formDayIndex] || `Day ${formDayIndex + 1}`,
        taskNumber: formTaskNumber,
        category: formCategory,
        title: formTitle.trim(),
        url: formUrl.trim(),
        rewardPkr: Number(formRewardPkr) || 10,
        rewardUsd: Number(formRewardUsd) || 1.00,
        timerSeconds: Number(formTimerSeconds) || 12,
        actionLabel: formCategory === 'youtube' ? 'Watch & Like' : formCategory === 'telegram' ? 'Launch Bot' : 'Visit & Earn',
        icon: formCategory === 'youtube' ? 'smart_display' : formCategory === 'telegram' ? 'send' : formCategory === 'mining' ? 'currency_bitcoin' : 'monetization_on',
        description: formDescription.trim() || 'Complete daily task to earn wallet rewards.',
        instructions: instructionsArray.length > 0 ? instructionsArray : ['Open link', 'Engage for 12 seconds', 'Auto-verify'],
        isLive: true
      };
      onUpdateTasks([...tasks, newTask]);
      setFeedback(`New task "${formTitle}" added to ${dayLabels[formDayIndex]}!`);
    }

    setIsAddModalOpen(false);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to remove this task from rotation?')) {
      const updated = tasks.filter(t => t.id !== taskId);
      onUpdateTasks(updated);
      setFeedback('Task removed from schedule.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleToggleTaskLive = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, isLive: !t.isLive };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span>Live Daily Tasks &amp; 7-Day Schedule Manager</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                Auto-Rotating Daily
              </span>
            </h4>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1 max-w-2xl">
            Configure the 3 daily tasks served to users. Each task rewards <strong>10 PKR</strong> (Pakistani users) or <strong>$1.00 USD</strong> (International users) with automatic 12s verification and wallet credit.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Day Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            selectedDayFilter === 'all'
              ? 'bg-emerald-500 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          All 7 Days ({tasks.length} tasks)
        </button>

        {dayLabels.map((label, idx) => {
          const isCurrentToday = idx === currentTodayIndex;
          const count = tasks.filter(t => t.dayIndex === idx).length;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayFilter(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDayFilter === idx
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : isCurrentToday
                  ? 'bg-zinc-900 border border-emerald-500/50 text-emerald-400 hover:bg-zinc-800'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>{label.split(' ')[0]} {label.split(' ')[1]}</span>
              <span className="text-[10px] opacity-75">({count})</span>
              {isCurrentToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Active Today"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scheduled Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-400 font-mono text-xs">
            No tasks found for this filter. Click "Add Custom Task" or pick from the 31 Link Pool below.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-zinc-900/80 border rounded-2xl p-4 flex flex-col justify-between space-y-3 font-mono text-xs transition-all ${
                task.isLive ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/40 opacity-60 bg-zinc-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold">
                      {dayLabels[task.dayIndex]?.split(' ')[0]} • #{task.taskNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      task.category === 'youtube'
                        ? 'bg-red-500/20 text-red-400'
                        : task.category === 'telegram'
                        ? 'bg-sky-500/20 text-sky-400'
                        : task.category === 'mining'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {task.category}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    task.isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {task.isLive ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>

                <h5 className="font-bold text-white text-sm line-clamp-1">{task.title}</h5>
                <p className="text-zinc-400 text-[11px] line-clamp-2 mt-1">{task.description}</p>

                {/* Link preview */}
                <div className="mt-2 p-2 bg-black/50 rounded-lg border border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline truncate max-w-[200px]"
                  >
                    {task.url}
                  </a>
                  <span className="text-zinc-500 text-[10px] shrink-0 ml-1">
                    {task.timerSeconds || 12}s timer
                  </span>
                </div>

                {/* Reward Preview */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Pakistani Reward: <strong className="text-emerald-400">{task.rewardPkr} PKR</strong></span>
                  <span>Intl: <strong className="text-emerald-400">${task.rewardUsd.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTaskLive(task.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    task.isLive ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {task.isLive ? 'Pause Task' : 'Activate Live'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(task)}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MASTER POOL OF 31 OWNER LINKS (Provided in User Prompt) */}
      <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">folder_special</span>
              <span>Master Pool: 31 Verified Earning &amp; Mining Links</span>
            </h4>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Full list of 31 user links (YouTube channel shorts, Telegram mining bots, and earning apps). Click any link to immediately schedule it.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {ALL_OWNER_TASK_LINKS.length} Links Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1 text-xs font-mono">
          {ALL_OWNER_TASK_LINKS.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-black/60 rounded-xl border border-zinc-800 hover:border-zinc-700 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold">#{idx + 1}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    item.type === 'youtube'
                      ? 'bg-red-500/20 text-red-400'
                      : item.type === 'telegram'
                      ? 'bg-sky-500/20 text-sky-400'
                      : item.type === 'mining'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.type}
                  </span>
                </div>
                <div className="font-bold text-white text-xs line-clamp-1">{item.name}</div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline truncate block mt-0.5"
                >
                  {item.url}
                </a>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddModal(item)}
                className="w-full py-1.5 bg-zinc-800 hover:bg-emerald-500 hover:text-black text-emerald-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                <span>Add to Day Schedule</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ADD / EDIT TASK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-lg">edit_note</span>
                <span>{editingTask ? 'Edit Task Link' : 'Add New Daily Task Link'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscribe to Talha Ahmed Official & Like Shorts"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1">Task URL / Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://youtube.com/... or https://t.me/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-cyan-400 text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase text-[10px] mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="youtube">📺 YouTube Channel / Shorts</option>
                    <option value="telegram">✈️ Telegram Bot</option>
                    <option value="mining">⛏️ Mining Project</option>
                    <option value="earning">💵 Earning Platform</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase text-[10px] mb-1">Schedule Day</label>
                  <select
                    value={formDayIndex}
                    onChange={(e) => setFormDayIndex(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    {dayLabels.map((lbl, i) => (
                      <option key={i} value={i}>{lbl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase text-[10px] mb-1">Slot Number</label>
                  <select
                    value={formTaskNumber}
                    onChange={(e) => setFormTaskNumber(Number(e.target.value) as any)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value={1}>Task #1</option>
                    <option value={2}>Task #2</option>
                    <option value={3}>Task #3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase text-[10px] mb-1">Reward (PKR)</label>
                  <input
                    type="number"
                    value={formRewardPkr}
                    onChange={(e) => setFormRewardPkr(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase text-[10px] mb-1">Reward (USD)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formRewardUsd}
                    onChange={(e) => setFormRewardUsd(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Watch latest Shorts and subscribe for daily rewards."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1">Instructions (One per line)</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Click the link to open&#10;Engage with content for 12 seconds&#10;Automatic verification credits reward"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  {editingTask ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

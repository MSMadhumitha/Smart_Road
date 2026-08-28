import React from 'react';

const Badge = ({ type, value }) => {
  const getStyles = () => {
    const val = String(value).toLowerCase();

    if (type === 'status') {
      switch (val) {
        case 'pending':
          return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
        case 'inspected':
          return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30';
        case 'in review':
        case 'in_review':
          return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
        case 'in progress':
        case 'in_progress':
          return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30';
        case 'resolved':
          return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
        case 'rejected':
          return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30';
        default:
          return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/30';
      }
    }

    if (type === 'severity' || type === 'priority') {
      switch (val) {
        case 'high':
          return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
        case 'medium':
          return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
        case 'low':
          return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700/50';
        default:
          return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50';
      }
    }

    // Damage type
    switch (val) {
      case 'pothole':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'crack':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
      default:
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
    }
  };

  const displayValue = () => {
    if (value === 'In_Review') return 'In Review';
    if (value === 'In_Progress') return 'In Progress';
    return value;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize ${getStyles()}`}>
      {displayValue()}
    </span>
  );
};

export default Badge;


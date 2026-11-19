import type { AssignmentStatus } from '../types/assignment';

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDaysUntilDue(dueDate: string): number {
  const today = parseIsoDate(getTodayIsoDate()).getTime();
  const target = parseIsoDate(dueDate).getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function isAssignmentOverdue(dueDate: string, status: AssignmentStatus): boolean {
  if (status === 'Completed') return false;
  return dueDate < getTodayIsoDate();
}

export function isAssignmentDueSoon(dueDate: string, status: AssignmentStatus): boolean {
  if (status === 'Completed') return false;
  const days = getDaysUntilDue(dueDate);
  return days >= 0 && days <= 3;
}

export function formatDisplayDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDeadlineLabel(dueDate: string, status: AssignmentStatus): string {
  if (status === 'Completed') return 'Completed';
  const diff = getDaysUntilDue(dueDate);
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  if (diff === -1) return '1 day overdue';
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff <= 7) return `Due in ${diff} days`;
  return formatShortDate(dueDate);
}

export interface CalendarCell {
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

export function getMonthCalendarCells(year: number, monthIndex: number): CalendarCell[] {
  const todayIso = getTodayIsoDate();
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun
  const startDate = new Date(year, monthIndex, 1 - startWeekday);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + i
    );
    const isoDate = toIsoDate(cellDate);
    cells.push({
      isoDate,
      dayNumber: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthIndex,
      isToday: isoDate === todayIso,
    });
  }
  return cells;
}

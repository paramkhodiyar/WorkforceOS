'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import DateTimePicker from '../../../components/ui/DateTimePicker';

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarEvent {
  id: string;
  masterEventId?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  meetingLink?: string;
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval: number;
  recurrenceDays?: string;
  recurrenceEndDate?: string;
  creatorId?: string;
  isLeave?: boolean;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  attendees: Array<{
    userId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      designation?: string;
    };
  }>;
  isOccurrence?: boolean;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const toast = useToast();
  const customConfirm = useConfirm();

  const [currentDate, setCurrentDate] = useState<Date>(new Date("2026-07-06T13:30:00")); // Lock near the current local time for testing
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Event form state
  const [eventForm, setEventForm] = useState({
    id: '',
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    meetingLink: '',
    recurrenceType: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recurrenceInterval: 1,
    recurrenceDays: [] as string[],
    recurrenceEndDate: '',
    inviteeIds: [] as string[]
  });

  // Availability Checker State
  const [availabilityList, setAvailabilityList] = useState<any[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  async function loadData() {
    try {
      setLoading(true);
      const { start, end } = getViewRange();
      const eventsRes = await api.calendar.listEvents(start.toISOString(), end.toISOString());
      setEvents(eventsRes.data || []);

      // Use /employees/directory — accessible to all org members without special permissions
      try {
        const dirRes = await api.employees.directory();
        setEmployees(dirRes.data || []);
      } catch {
        // Silently ignore if directory fails — invitee picker just won't show
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }

  function getViewRange() {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      // Go back to the first day of the grid (Sunday before start of month)
      start.setDate(start.getDate() - start.getDay());

      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // last day of month
      end.setHours(23, 59, 59, 999);
      // Go forward to the end day of the grid (Saturday after end of month)
      end.setDate(end.getDate() + (6 - end.getDay()));
    } else if (view === 'week') {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  // Handle Invitation RSVP
  async function handleRSVP(eventId: string, status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE') {
    try {
      await api.calendar.respond(eventId, status);
      toast.success(`RSVP updated to ${status.toLowerCase()}`);
      if (selectedEvent) {
        setSelectedEvent(prev => {
          if (!prev) return null;
          const updatedAttendees = prev.attendees.map(a => 
            a.userId === user?.id ? { ...a, status } : a
          );
          return { ...prev, attendees: updatedAttendees };
        });
      }
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit RSVP');
    }
  }

  // Handle Event deletion/cancel
  async function handleDeleteEvent(id: string) {
    const ok = await customConfirm({
      title: 'Delete Meeting',
      message: 'Are you sure you want to delete/cancel this meeting?',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await api.calendar.deleteEvent(id);
      toast.success('Meeting deleted successfully');
      setSelectedEvent(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete meeting');
    }
  }

  // Handle Instance deletion
  async function handleDeleteInstance(id: string, dateStr: string) {
    const ok = await customConfirm({
      title: 'Cancel Occurrence',
      message: 'Are you sure you want to cancel ONLY this single meeting occurrence?',
      variant: 'warning',
      confirmLabel: 'Cancel Occurrence',
    });
    if (!ok) return;
    try {
      await api.calendar.deleteInstance(id, dateStr);
      toast.success('Meeting occurrence cancelled successfully');
      setSelectedEvent(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel occurrence');
    }
  }

  // Create or Update submit handler
  async function handleSubmitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!eventForm.startTime || !eventForm.endTime) {
      toast.error('Start and End times are required');
      return;
    }
    if (new Date(eventForm.startTime) >= new Date(eventForm.endTime)) {
      toast.error('Start time must be before end time');
      return;
    }

    const payload = {
      title: eventForm.title,
      description: eventForm.description || undefined,
      location: eventForm.location || undefined,
      startTime: new Date(eventForm.startTime).toISOString(),
      endTime: new Date(eventForm.endTime).toISOString(),
      isAllDay: eventForm.isAllDay,
      meetingLink: eventForm.meetingLink || undefined,
      recurrenceType: eventForm.recurrenceType,
      recurrenceInterval: Number(eventForm.recurrenceInterval) || 1,
      recurrenceDays: eventForm.recurrenceType === 'WEEKLY' ? eventForm.recurrenceDays.join(',') : undefined,
      recurrenceEndDate: eventForm.recurrenceEndDate ? new Date(eventForm.recurrenceEndDate).toISOString() : undefined,
      inviteeIds: eventForm.inviteeIds
    };

    try {
      if (eventForm.id) {
        await api.calendar.updateEvent(eventForm.id, payload);
        toast.success('Meeting updated successfully');
      } else {
        await api.calendar.createEvent(payload);
        toast.success('Meeting scheduled successfully');
      }
      setIsCreateOpen(false);
      resetEventForm();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    }
  }

  function resetEventForm() {
    setEventForm({
      id: '',
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      isAllDay: false,
      meetingLink: '',
      recurrenceType: 'NONE',
      recurrenceInterval: 1,
      recurrenceDays: [],
      recurrenceEndDate: '',
      inviteeIds: []
    });
    setAvailabilityList([]);
  }

  // Pre-fill creation modal for double click cell
  function openCreateModalForDate(date: Date) {
    resetEventForm();
    const isoString = date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    setEventForm(prev => ({
      ...prev,
      startTime: `${isoString}T10:00`,
      endTime: `${isoString}T11:00`
    }));
    setIsCreateOpen(true);
  }

  // Pre-fill edit modal for existing event
  function openEditModal(event: CalendarEvent) {
    setEventForm({
      id: event.id,
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: new Date(event.endTime).toISOString().slice(0, 16),
      isAllDay: event.isAllDay,
      meetingLink: event.meetingLink || '',
      recurrenceType: event.recurrenceType,
      recurrenceInterval: event.recurrenceInterval,
      recurrenceDays: event.recurrenceDays ? event.recurrenceDays.split(',') : [],
      recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate).toISOString().slice(0, 16) : '',
      inviteeIds: event.attendees.map(a => a.userId)
    });
    setSelectedEvent(null);
    setIsCreateOpen(true);
  }

  // Real-time Availability checking trigger
  async function triggerAvailabilityCheck() {
    if (eventForm.inviteeIds.length === 0 || !eventForm.startTime || !eventForm.endTime) {
      setAvailabilityList([]);
      return;
    }

    // Validate that times parse correctly before sending to API
    const startMs = Date.parse(eventForm.startTime);
    const endMs = Date.parse(eventForm.endTime);
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      setAvailabilityList([]);
      return;
    }

    try {
      setCheckingAvailability(true);
      const res = await api.calendar.checkAvailability({
        inviteeIds: eventForm.inviteeIds,
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString()
      });
      setAvailabilityList(res.data || []);
    } catch (err) {
      console.error('Availability check failed', err);
    } finally {
      setCheckingAvailability(false);
    }
  }

  // Run availability check whenever invitees or time slot changes
  useEffect(() => {
    if (isCreateOpen) {
      triggerAvailabilityCheck();
    }
  }, [eventForm.inviteeIds, eventForm.startTime, eventForm.endTime, isCreateOpen]);

  // Compute month view layout
  const startOfGrid = getViewRange().start;
  const gridCells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startOfGrid);
    d.setDate(startOfGrid.getDate() + i);
    gridCells.push(d);
  }

  // Get week columns
  const weekStart = getViewRange().start;
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d);
  }

  // Switch months/dates
  function adjustDate(amount: number) {
    const d = new Date(currentDate);
    if (view === 'month') {
      d.setMonth(d.getMonth() + amount);
    } else if (view === 'week') {
      d.setDate(d.getDate() + amount * 7);
    } else {
      d.setDate(d.getDate() + amount);
    }
    setCurrentDate(d);
  }

  function getStatusStyle(status?: string, isLeave?: boolean) {
    if (isLeave) return 'bg-rose-50 text-rose-700 border-rose-200';
    switch (status) {
      case 'ACCEPTED': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DECLINED': return 'bg-red-50 text-red-800 border-red-200';
      case 'TENTATIVE': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  }

  // Render availability assistant helper suggestions
  function renderSuggestions() {
    const busyInvitees = availabilityList.filter(a => !a.isAvailable);
    if (busyInvitees.length === 0) return null;

    // Offer suggested slot (e.g. 1 hour later or shifting hours)
    const originalStart = new Date(eventForm.startTime);
    const originalEnd = new Date(eventForm.endTime);
    const duration = originalEnd.getTime() - originalStart.getTime();

    const suggestedStart = new Date(originalStart);
    suggestedStart.setHours(suggestedStart.getHours() + 2); // Shift 2 hours later
    const suggestedEnd = new Date(suggestedStart.getTime() + duration);

    const suggestStartStr = suggestedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const suggestEndStr = suggestedEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-[11px] text-red-800">
        <p className="font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          Conflict Detected
        </p>
        <p>The following guests are busy or on leave during this slot:</p>
        <ul className="list-disc pl-4 mt-1 font-semibold space-y-0.5">
          {busyInvitees.map(a => (
            <li key={a.userId}>
              {a.name} ({a.conflicts.map((c: any) => `${c.title} [${c.type}]`).join(', ')})
            </li>
          ))}
        </ul>
        <p className="mt-2 text-slate-700">
          💡 Suggested Conflict-free Slot: <button 
            type="button"
            onClick={() => {
              setEventForm(prev => ({
                ...prev,
                startTime: suggestedStart.toISOString().slice(0, 16),
                endTime: suggestedEnd.toISOString().slice(0, 16)
              }));
            }}
            className="text-primary font-bold hover:underline cursor-pointer"
          >
            {suggestStartStr} - {suggestEndStr}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Company Calendar</h1>
          <p className="text-body-sm text-outline">Schedule syncs, check coworkers schedules, and manage event recurrences</p>
        </div>
        <button
          onClick={() => { resetEventForm(); setIsCreateOpen(true); }}
          className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary text-label-md font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Schedule Meeting
        </button>
      </div>

      {/* Control bar */}
      <div className="flex justify-between items-center bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => adjustDate(-1)} 
            className="p-2 border border-outline-variant hover:bg-slate-50 rounded-lg text-slate-700 cursor-pointer font-bold flex"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-3 py-2 border border-outline-variant hover:bg-slate-50 rounded-lg text-label-sm font-bold text-slate-700 cursor-pointer"
          >
            Today
          </button>
          <button 
            onClick={() => adjustDate(1)} 
            className="p-2 border border-outline-variant hover:bg-slate-50 rounded-lg text-slate-700 cursor-pointer font-bold flex"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <h2 className="text-title-lg font-bold text-slate-800 ml-2">
            {view === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'week' && `Week of ${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
            {view === 'day' && currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
        </div>

        <div className="flex border border-outline-variant rounded-lg overflow-hidden bg-slate-50">
          {(['month', 'week', 'day'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-label-sm font-bold capitalize transition-colors cursor-pointer ${
                view === v 
                  ? 'bg-primary text-white' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar content grid */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
          
          {/* MONTH VIEW */}
          {view === 'month' && (
            <div className="grid grid-cols-7 border-collapse">
              {/* Header columns */}
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="border-b border-r last:border-r-0 border-outline-variant p-2 text-center text-section-cap font-bold text-outline">
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {gridCells.map((cellDate, idx) => {
                const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth();
                const isToday = cellDate.toDateString() === new Date().toDateString();
                
                // Fetch events for this date
                const dayEvents = events.filter(e => {
                  const s = new Date(e.startTime);
                  const ed = new Date(e.endTime);
                  
                  // Reset hours to compare dates only
                  const sNormal = new Date(s); sNormal.setHours(0,0,0,0);
                  const edNormal = new Date(ed); edNormal.setHours(0,0,0,0);
                  const cellNormal = new Date(cellDate); cellNormal.setHours(0,0,0,0);

                  return cellNormal >= sNormal && cellNormal <= edNormal;
                });

                return (
                  <div
                    key={idx}
                    onDoubleClick={() => openCreateModalForDate(cellDate)}
                    className={`min-h-[110px] border-b border-r last:border-r-0 border-outline-variant p-1 flex flex-col space-y-1 transition-all select-none hover:bg-slate-50/50 ${
                      isCurrentMonth ? 'bg-white' : 'bg-slate-50/30 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-label-sm font-bold h-6 w-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-primary text-white' : 'text-slate-700'
                      }`}>
                        {cellDate.getDate()}
                      </span>
                    </div>

                    <div className="flex-grow space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                      {dayEvents.map(e => (
                        <div
                          key={e.id}
                          onClick={(evt) => { evt.stopPropagation(); setSelectedEvent(e); }}
                          className={`px-2 py-0.5 border text-[10px] font-bold rounded cursor-pointer truncate transition-all active:scale-[0.98] ${
                            getStatusStyle(e.attendees.find(a => a.userId === user?.id)?.status, e.isLeave)
                          }`}
                          title={`${e.title} (${new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                        >
                          {!e.isLeave && (
                            <span className="font-mono mr-1">
                              {new Date(e.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })}
                            </span>
                          )}
                          {e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="grid grid-cols-8 border-collapse">
              {/* Hours Column */}
              <div className="border-r border-outline-variant flex flex-col bg-slate-50">
                <div className="h-[50px] border-b border-outline-variant flex items-center justify-center text-[10px] font-bold text-outline">TIME</div>
                {Array.from({ length: 13 }).map((_, h) => (
                  <div key={h} className="h-16 border-b border-outline-variant p-1 text-[9px] font-bold text-slate-500 text-right pr-2">
                    {String(8 + h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((wDay, dIdx) => {
                const isToday = wDay.toDateString() === new Date().toDateString();
                const dayEvents = events.filter(e => {
                  const s = new Date(e.startTime);
                  const ed = new Date(e.endTime);
                  const sNormal = new Date(s); sNormal.setHours(0,0,0,0);
                  const edNormal = new Date(ed); edNormal.setHours(0,0,0,0);
                  const dayNormal = new Date(wDay); dayNormal.setHours(0,0,0,0);
                  return dayNormal >= sNormal && dayNormal <= edNormal;
                });

                return (
                  <div key={dIdx} className="border-r last:border-r-0 border-outline-variant flex flex-col min-w-[100px]">
                    <div className={`h-[50px] border-b border-outline-variant p-2 text-center flex flex-col justify-center ${
                      isToday ? 'bg-primary-container/20 border-b-2 border-b-primary' : 'bg-white'
                    }`}>
                      <span className="text-[10px] font-bold text-outline">{DAYS_OF_WEEK[wDay.getDay()]}</span>
                      <span className="text-label-md font-extrabold text-slate-800">{wDay.getDate()}</span>
                    </div>

                    <div className="relative flex-grow h-[832px] bg-white">
                      {dayEvents.map(e => {
                        const s = new Date(e.startTime);
                        const ed = new Date(e.endTime);
                        
                        // Calculate absolute positioning inside 8:00 to 21:00 grid (13 hours)
                        // Each hour is 64px (h-16 is 4rem = 64px)
                        const startHour = s.getHours() + s.getMinutes() / 60;
                        const endHour = ed.getHours() + ed.getMinutes() / 60;
                        
                        const top = Math.max(0, (startHour - 8) * 64);
                        const height = Math.max(20, (endHour - startHour) * 64);

                        if (startHour > 21 || endHour < 8) return null; // out of visible bounds

                        return (
                          <div
                            key={e.id}
                            onClick={() => setSelectedEvent(e)}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            className={`absolute left-1 right-1 p-1.5 border rounded text-[9px] font-bold overflow-hidden cursor-pointer select-none transition-all active:scale-[0.98] z-10 flex flex-col justify-between ${
                              getStatusStyle(e.attendees.find(a => a.userId === user?.id)?.status, e.isLeave)
                            }`}
                          >
                            <div>
                              <p className="truncate leading-tight font-extrabold">{e.title}</p>
                              {!e.isLeave && (
                                <p className="text-[8px] font-semibold opacity-85 mt-0.5">
                                  {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {ed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </p>
                              )}
                            </div>
                            {e.location && <p className="text-[7px] truncate mt-auto">📍 {e.location}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DAILY VIEW */}
          {view === 'day' && (
            <div className="grid grid-cols-1 border-collapse bg-white">
              <div className="p-4 bg-slate-50 border-b border-outline-variant flex justify-between items-center">
                <span className="text-label-md font-bold text-outline">DAILY MEETING LIST</span>
                <span className="text-label-md font-extrabold text-primary uppercase tracking-wide">
                  {events.filter(e => {
                    const s = new Date(e.startTime);
                    return s.toDateString() === currentDate.toDateString();
                  }).length} Scheduled
                </span>
              </div>

              <div className="p-6 divide-y divide-outline-variant space-y-4">
                {events.filter(e => {
                  const s = new Date(e.startTime);
                  const ed = new Date(e.endTime);
                  const sNormal = new Date(s); sNormal.setHours(0,0,0,0);
                  const edNormal = new Date(ed); edNormal.setHours(0,0,0,0);
                  const currentNormal = new Date(currentDate); currentNormal.setHours(0,0,0,0);
                  return currentNormal >= sNormal && currentNormal <= edNormal;
                }).length === 0 ? (
                  <p className="text-center text-outline py-8 text-body-md font-medium">No meetings or events scheduled for today.</p>
                ) : (
                  events.filter(e => {
                    const s = new Date(e.startTime);
                    const ed = new Date(e.endTime);
                    const sNormal = new Date(s); sNormal.setHours(0,0,0,0);
                    const edNormal = new Date(ed); edNormal.setHours(0,0,0,0);
                    const currentNormal = new Date(currentDate); currentNormal.setHours(0,0,0,0);
                    return currentNormal >= sNormal && currentNormal <= edNormal;
                  }).map(e => (
                    <div 
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 hover:bg-slate-50/50 rounded-xl p-3 cursor-pointer transition-colors"
                    >
                      <div className="w-24 text-right shrink-0">
                        {!e.isLeave ? (
                          <>
                            <p className="text-title-md font-extrabold text-slate-800">
                              {new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                            <p className="text-body-sm text-outline font-semibold mt-0.5">
                              to {new Date(e.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                          </>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">All Day</span>
                        )}
                      </div>

                      <div className="flex-grow space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-title-md font-bold text-slate-800">{e.title}</h3>
                          <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase ${
                            getStatusStyle(e.attendees.find(a => a.userId === user?.id)?.status, e.isLeave)
                          }`}>
                            {e.isLeave ? 'On Leave' : (e.attendees.find(a => a.userId === user?.id)?.status || 'PENDING')}
                          </span>
                        </div>
                        <p className="text-body-sm text-slate-500 font-medium italic">{e.description || 'No description provided.'}</p>
                        {e.location && <p className="text-[11px] text-outline font-bold">📍 {e.location}</p>}
                        {e.meetingLink && (
                          <p className="text-[11px] text-primary font-bold">
                            🔗 <a href={e.meetingLink} target="_blank" rel="noopener noreferrer" onClick={evt => evt.stopPropagation()} className="hover:underline">{e.meetingLink}</a>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6 animate-slide-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-outline-variant pb-4">
              <div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 border rounded uppercase ${
                  selectedEvent.isLeave ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-primary-container text-on-primary-container border-primary/20'
                }`}>
                  {selectedEvent.isLeave ? 'Out of Office' : (selectedEvent.recurrenceType !== 'NONE' ? `${selectedEvent.recurrenceType} MEETING` : 'MEETING')}
                </span>
                <h3 className="text-headline-sm font-bold text-slate-800 mt-1">{selectedEvent.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Event Time and Location Info */}
            <div className="space-y-3 text-body-sm text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">schedule</span>
                <span>
                  {new Date(selectedEvent.startTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  {!selectedEvent.isLeave && ` - ${new Date(selectedEvent.endTime).toLocaleTimeString([], { timeStyle: 'short' })}`}
                </span>
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">location_on</span>
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.meetingLink && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[18px]">videocam</span>
                  <a 
                    href={selectedEvent.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    Join External Meeting
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              )}

              {selectedEvent.description && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                  <p className="italic text-slate-500">"{selectedEvent.description}"</p>
                </div>
              )}
            </div>

            {/* Attendees RSVP list */}
            {!selectedEvent.isLeave && (
              <div className="space-y-2">
                <h4 className="text-label-md font-bold text-outline uppercase tracking-wider">Guests ({selectedEvent.attendees.length})</h4>
                <div className="max-h-[150px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {selectedEvent.attendees.map(a => (
                    <div key={a.userId} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center text-body-sm">
                      <div>
                        <p className="font-bold text-slate-800">{a.user.firstName} {a.user.lastName}</p>
                        <p className="text-[10px] text-outline">{a.user.designation || 'Employee'}</p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          getStatusStyle(a.status)
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RSVP Response controls for user */}
            {!selectedEvent.isLeave && selectedEvent.attendees.some(a => a.userId === user?.id) && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider block">Your Invitation Status</span>
                <div className="flex gap-2">
                  {[
                    { label: 'Accept', status: 'ACCEPTED' as const, style: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                    { label: 'Decline', status: 'DECLINED' as const, style: 'bg-red-600 hover:bg-red-700 text-white' },
                    { label: 'Tentative', status: 'TENTATIVE' as const, style: 'bg-amber-500 hover:bg-amber-600 text-white' }
                  ].map(btn => {
                    const isCurrent = selectedEvent.attendees.find(a => a.userId === user?.id)?.status === btn.status;
                    return (
                      <button
                        key={btn.status}
                        disabled={isCurrent}
                        onClick={() => handleRSVP(selectedEvent.id.split('_')[0], btn.status)} // Use master event ID for RSVP
                        className={`flex-grow py-2 text-label-sm font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98] ${
                          isCurrent 
                            ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed' 
                            : btn.style
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event actions (Creator options) */}
            <div className="flex justify-between items-center border-t border-outline-variant pt-4 flex-wrap gap-2">
              <div>
                {!selectedEvent.isLeave && selectedEvent.creatorId === user?.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(selectedEvent)}
                      className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-label-sm font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id.split('_')[0])}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-label-sm font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Cancel Meeting
                    </button>
                    {selectedEvent.isOccurrence && (
                      <button
                        onClick={() => {
                          const dateParts = selectedEvent.id.split('_')[1];
                          handleDeleteInstance(selectedEvent.id.split('_')[0], dateParts);
                        }}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-label-sm font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                      >
                        Cancel This Instance Only
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-primary hover:bg-blue-700 text-on-primary text-label-sm font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98] shrink-0"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE / EDIT MEETING MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 my-8 animate-slide-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-outline-variant pb-4">
              <div>
                <h3 className="text-headline-sm font-bold text-slate-800">
                  {eventForm.id ? 'Edit Scheduled Meeting' : 'Schedule New Meeting'}
                </h3>
                <p className="text-body-sm text-outline">Organize meetings and configure automatic conflict checks</p>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-4">
              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-[10px] text-outline uppercase font-bold block">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales alignment sync, Product retro"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>

              {/* Description & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold block">Location / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Conference Room A, Virtual"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-outline uppercase font-bold block">External Video Meeting Link</label>
                  <input
                    type="text"
                    placeholder="e.g. https://zoom.us/j/..., https://meet.google.com/..."
                    value={eventForm.meetingLink}
                    onChange={(e) => setEventForm({ ...eventForm, meetingLink: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                  />
                </div>
              </div>

              {/* Start & End Times — Custom Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  // MUST use local time — toISOString() gives UTC and would be wrong for IST/any TZ
                  const nowLocal = (() => {
                    const n = new Date();
                    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}T${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
                  })();
                  return (
                    <>
                      <DateTimePicker
                        label="Start Time"
                        value={eventForm.startTime}
                        min={nowLocal}
                        onChange={(v) => setEventForm(f => ({ ...f, startTime: v }))}
                        placeholder="Select start date & time"
                        required
                      />
                      <DateTimePicker
                        label="End Time"
                        value={eventForm.endTime}
                        min={eventForm.startTime || nowLocal}
                        onChange={(v) => setEventForm(f => ({ ...f, endTime: v }))}
                        placeholder="Select end date & time"
                        required
                      />
                    </>
                  );
                })()}
              </div>

              {/* Recurrence Setup */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline uppercase font-bold block">Recurrence Type</label>
                    <select
                      value={eventForm.recurrenceType}
                      onChange={(e) => setEventForm({ ...eventForm, recurrenceType: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium cursor-pointer"
                    >
                      <option value="NONE">Does not repeat (One-off)</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  
                  {eventForm.recurrenceType !== 'NONE' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase font-bold block">Repeat Interval</label>
                        <input
                          type="number"
                          min={1}
                          value={eventForm.recurrenceInterval}
                          onChange={(e) => setEventForm({ ...eventForm, recurrenceInterval: Math.max(1, Number(e.target.value)) })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase font-bold block">Ends On (EndDate)</label>
                        <input
                          type="datetime-local"
                          value={eventForm.recurrenceEndDate}
                          onChange={(e) => setEventForm({ ...eventForm, recurrenceEndDate: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>

                {eventForm.recurrenceType === 'WEEKLY' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline uppercase font-bold block mb-1">Repeat Days</label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map(day => {
                        const isSelected = eventForm.recurrenceDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              setEventForm(prev => {
                                const newDays = isSelected 
                                  ? prev.recurrenceDays.filter(d => d !== day) 
                                  : [...prev.recurrenceDays, day];
                                return { ...prev, recurrenceDays: newDays };
                              });
                            }}
                            className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Invite List & Availability checking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-outline-variant pt-4">
                
                {/* Invitee selector */}
                <div className="space-y-2">
                  <label className="text-[10px] text-outline uppercase font-bold block">Invite Coworkers / Guests</label>
                  <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50/50">
                    {employees.filter(emp => emp.id !== user?.id).map(emp => {
                      const isSelected = eventForm.inviteeIds.includes(emp.id);
                      return (
                        <div 
                          key={emp.id}
                          onClick={() => {
                            setEventForm(prev => {
                              const newIds = isSelected 
                                ? prev.inviteeIds.filter(id => id !== emp.id) 
                                : [...prev.inviteeIds, emp.id];
                              return { ...prev, inviteeIds: newIds };
                            });
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg border text-body-sm font-medium cursor-pointer transition-all hover:bg-slate-50 ${
                            isSelected ? 'bg-white border-primary' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[9px] text-outline uppercase font-semibold">{emp.designation || 'Staff'}</p>
                          </div>
                          <span className="material-symbols-outlined text-primary text-[18px]">
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scheduling assistant */}
                <div className="space-y-2">
                  <label className="text-[10px] text-outline uppercase font-bold block">Coworkers Live Availability Status</label>
                  <div className="min-h-[120px] p-3 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between gap-3">
                    
                    {eventForm.inviteeIds.length === 0 ? (
                      <p className="text-[11px] text-outline font-medium text-center my-auto">Select coworkers on the left to verify their availability in real time.</p>
                    ) : (
                      <div className="space-y-2 flex-grow overflow-y-auto max-h-[140px] pr-1">
                        {checkingAvailability ? (
                          <p className="text-[10px] text-slate-500 font-bold animate-pulse text-center">Checking schedules...</p>
                        ) : (
                          availabilityList.map(a => (
                            <div key={a.userId} className="flex justify-between items-center text-[11px] font-semibold py-1 border-b border-slate-100 last:border-b-0">
                              <span className="text-slate-700">{a.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5 uppercase ${
                                a.isAvailable 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                <span className="material-symbols-outlined text-[10px] font-bold">
                                  {a.isAvailable ? 'check' : 'close'}
                                </span>
                                {a.isAvailable ? 'Available' : 'Busy'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Suggestions output block */}
                    {renderSuggestions()}

                  </div>
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-outline uppercase font-bold block">Event Description / Agenda</label>
                <textarea
                  placeholder="Provide meeting agenda or notes for guests..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface font-medium"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-label-md font-bold transition-all cursor-pointer text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-blue-750 text-on-primary rounded-xl text-label-md font-bold transition-all cursor-pointer active:scale-[0.98]"
                >
                  {eventForm.id ? 'Save Changes' : 'Schedule Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

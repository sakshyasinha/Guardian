/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App & Auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// Keep token in memory (session storage-like)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

// Sandbox/Demo Calendar Events representing a typical busy student/builder's schedule
export const SANDBOX_EVENTS: CalendarEvent[] = [
  {
    id: 'sb-1',
    summary: 'Advanced Database Systems Lecture',
    start: { dateTime: '2026-06-27T09:30:00-07:00' },
    end: { dateTime: '2026-06-27T11:00:00-07:00' }
  },
  {
    id: 'sb-2',
    summary: 'Weekly Group Alignment Sync',
    start: { dateTime: '2026-06-27T12:00:00-07:00' },
    end: { dateTime: '2026-06-27T13:00:00-07:00' }
  },
  {
    id: 'sb-3',
    summary: 'Introductory Physics Lab (Mandatory)',
    start: { dateTime: '2026-06-27T14:30:00-07:00' },
    end: { dateTime: '2026-06-27T17:00:00-07:00' }
  },
  {
    id: 'sb-4',
    summary: 'Dentist Appointment',
    start: { dateTime: '2026-06-28T10:00:00-07:00' },
    end: { dateTime: '2026-06-28T11:30:00-07:00' }
  },
  {
    id: 'sb-5',
    summary: 'Recruiter Prep Session',
    start: { dateTime: '2026-06-28T15:00:00-07:00' },
    end: { dateTime: '2026-06-28T16:00:00-07:00' }
  }
];

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google authentication');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (
      error?.code === 'auth/popup-closed-by-user' || 
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('popup_closed_by_user') ||
      error?.code?.includes('closed-by-user')
    ) {
      const friendlyError = new Error(
        "Google Sign-In was closed or blocked. Because the app is running in a secure sandboxed iframe, your browser may have blocked the popup. To connect successfully, please open the application in a new tab (using the button at the top right of the screen) or allow popups in your browser."
      );
      (friendlyError as any).code = error.code || 'auth/popup-closed-by-user';
      throw friendlyError;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Fetch calendar events for today & tomorrow
 */
export const fetchGoogleEvents = async (accessToken: string): Promise<CalendarEvent[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeMin = today.toISOString();
    
    const endRange = new Date();
    endRange.setDate(today.getDate() + 3);
    endRange.setHours(23, 59, 59, 999);
    const timeMax = endRange.toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Google Calendar API returned status ${res.status}`);
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || 'Busy block',
      start: item.start || {},
      end: item.end || {},
    }));
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    throw err;
  }
};

/**
 * Calculate available work hours in a 9:00 AM - 6:00 PM (9 hours) focus window
 * after subtracting calendar event overlaps
 */
export const calculateAvailableHours = (
  events: CalendarEvent[], 
  targetDateStr: string = '2026-06-27'
): { availableHours: number; conflictMinutes: number; conflictingEvents: string[] } => {
  // Define work hours window: 9:00 AM to 6:00 PM local time
  const workStartHour = 9;
  const workEndHour = 18;
  const totalWorkMinutes = (workEndHour - workStartHour) * 60; // 540 minutes = 9 hours

  const targetDate = new Date(targetDateStr);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  const workStart = new Date(targetYear, targetMonth, targetDay, workStartHour, 0, 0);
  const workEnd = new Date(targetYear, targetMonth, targetDay, workEndHour, 0, 0);

  let conflictMinutes = 0;
  const conflictingEvents: string[] = [];

  events.forEach(event => {
    const startStr = event.start.dateTime || event.start.date;
    const endStr = event.end.dateTime || event.end.date;

    if (!startStr || !endStr) return;

    const eventStart = new Date(startStr);
    const eventEnd = new Date(endStr);

    // Filter events not on this day
    if (
      eventStart.getFullYear() !== targetYear ||
      eventStart.getMonth() !== targetMonth ||
      eventStart.getDate() !== targetDay
    ) {
      return;
    }

    // Calculate overlap with 9:00 AM - 6:00 PM focus block
    const overlapStart = eventStart > workStart ? eventStart : workStart;
    const overlapEnd = eventEnd < workEnd ? eventEnd : workEnd;

    if (overlapStart < overlapEnd) {
      const overlapMs = overlapEnd.getTime() - overlapStart.getTime();
      const overlapMins = overlapMs / (1000 * 60);
      conflictMinutes += overlapMins;
      conflictingEvents.push(`${event.summary} (${Math.round(overlapMins)} mins overlap)`);
    }
  });

  const availableMinutes = Math.max(0, totalWorkMinutes - conflictMinutes);
  const availableHours = parseFloat((availableMinutes / 60).toFixed(1));

  return {
    availableHours,
    conflictMinutes: Math.round(conflictMinutes),
    conflictingEvents
  };
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Goal, Task, TimelineStatus, FocusSession, RecoveryRecommendation, GamificationState, BlockerType, BlockerRecord, CompletionHistory, CompletionDayData, ToastState } from '../src/types';
import { getAdaptiveDurationMultiplier } from '../lib/blockerEngine';
import { googleSignIn, googleSignOut, fetchGoogleEvents, SANDBOX_EVENTS, CalendarEvent, calculateAvailableHours } from '../lib/calendarService';

// Client-side smart local planner for network-offline scenarios (Layer 3 fallback)
export function getMockTasksClient(goalName: string, estimatedHours: number, description?: string): any[] {
  const norm = (goalName + " " + (description || "")).toLowerCase();
  
  // Classify categories
  let category: 'Academic Exam' | 'Academic Assignment' | 'Hackathon Project' | 'Research Project' | 'Essay / Paper' | 'Interview Preparation' | 'Personal Event' | 'Custom Goal' = 'Custom Goal';
  
  if (norm.includes("exam") || norm.includes("test") || norm.includes("quiz") || norm.includes("midterm") || norm.includes("final") || norm.includes("study") || norm.includes("revision") || norm.includes("subject") || norm.includes("class") || norm.includes("course") || norm.includes("lecture") || norm.includes("dbms") || norm.includes("networks") || norm.includes("biology") || norm.includes("math")) {
    category = 'Academic Exam';
  } else if (norm.includes("assignment") || norm.includes("homework") || norm.includes("hw") || norm.includes("lab") || norm.includes("problem set") || norm.includes("p-set") || norm.includes("psets")) {
    category = 'Academic Assignment';
  } else if (norm.includes("hackathon") || norm.includes("hack") || norm.includes("mvp") || norm.includes("prototype") || norm.includes("builder") || norm.includes("build") || norm.includes("app") || norm.includes("software") || norm.includes("website") || norm.includes("coding project")) {
    category = 'Hackathon Project';
  } else if (norm.includes("research") || norm.includes("thesis") || norm.includes("literature") || norm.includes("data analysis") || norm.includes("experiment") || norm.includes("survey") || norm.includes("academic paper")) {
    category = 'Research Project';
  } else if (norm.includes("essay") || norm.includes("paper") || norm.includes("draft") || norm.includes("writing") || norm.includes("report") || norm.includes("article") || norm.includes("write") || norm.includes("manuscript")) {
    category = 'Essay / Paper';
  } else if (norm.includes("interview") || norm.includes("prep") || norm.includes("resume") || norm.includes("leetcode") || norm.includes("portfolio") || norm.includes("career") || norm.includes("job") || norm.includes("internship") || norm.includes("mock interview")) {
    category = 'Interview Preparation';
  } else if (norm.includes("birthday") || norm.includes("party") || norm.includes("event") || norm.includes("trip") || norm.includes("travel") || norm.includes("anniversary") || norm.includes("celebration") || norm.includes("gift") || norm.includes("planning") || norm.includes("plan")) {
    category = 'Personal Event';
  }

  // Generate dynamic keywords/subjects from name to make milestones feel custom
  let cleanedTopic = goalName.replace(/(study for|prepare for|preparation for|planning|project|exam|assignment|homework|hw|test|quiz|hackathon)/gi, "").trim();
  if (!cleanedTopic) cleanedTopic = goalName;
  
  if (category === 'Academic Exam') {
    return [
      {
        title: `Review core ${cleanedTopic} concepts and lecture materials`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.25)),
        bestTimeContext: "Best done during your morning focus hours when retention is highest",
        whyItMatters: `Establishes a solid baseline of knowledge in ${cleanedTopic} to guide active recall later.`,
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 30,
        reminderRecommendation: "",
        checklist: [
          `Consolidate all lecture slides and textbooks regarding ${cleanedTopic}`,
          "Create a high-level summary index sheet listing core terms and formulas",
          "Pinpoint your top 3 major knowledge gaps to research first"
        ]
      },
      {
        title: `Solve active recall questions and practice problems for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.4)),
        bestTimeContext: "Best done when your logical and analytical energy is peak",
        whyItMatters: "Forces mental retrieval of concepts, creating stronger neural connections than passive reading.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          `Attempt 10-15 challenge questions on ${cleanedTopic} from reference sheets`,
          "Analyze correct answers and tag incorrect ones to revisit",
          "Synthesize high-yield study flashcards specifically for hard sub-topics"
        ]
      },
      {
        title: `Complete a comprehensive timed mock exam on ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done mid-day to mimic realistic exam environments",
        whyItMatters: `Builds procedural stamina and reduces exam anxiety for ${cleanedTopic}.`,
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 60,
        reminderRecommendation: "",
        checklist: [
          "Select a past paper or generate a 4-question mock set",
          "Set a countdown timer with zero tab distractions, papers, or music",
          "Self-grade your answers strictly and document weak points"
        ]
      },
      {
        title: `Final high-yield review of ${cleanedTopic} index cards and formulas`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.15)),
        bestTimeContext: "Best done during your evening wind-down focus hours",
        whyItMatters: "Consolidates memory paths right before sleep, maximizing cognitive performance.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "Get at least 7-8 hours of sleep. Your brain needs REM cycles to cement study material.",
        checklist: [
          `Review index flashcards for ${cleanedTopic} twice before rest`,
          "Validate all formula conversions and key definitions",
          "Prepare your exam kit (pencils, calculator, ID) to avoid morning rush"
        ]
      }
    ];
  }

  if (category === 'Academic Assignment') {
    return [
      {
        title: `Analyze ${cleanedTopic} specifications and outline requirements`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done in short, focused blocks to grasp the core rules",
        whyItMatters: "Prevents waste of effort on incorrect directions by clarifying requirements early.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "",
        checklist: [
          `Read the official ${cleanedTopic} rubric and specifications document`,
          "Define exact inputs, outputs, and format restrictions (PDF, zip, etc.)",
          "Set up your local directory and initialize required starter files"
        ]
      },
      {
        title: `Implement primary logic and core components of ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.5)),
        bestTimeContext: "Best done when your energy levels are at their absolute peak",
        whyItMatters: "Tackles the hardest 60% of the workload first to avoid a last-minute panic.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 60,
        reminderRecommendation: "",
        checklist: [
          `Draft primary structure and implement the core algorithms/arguments`,
          "Validate intermediate data processing results or outline arguments",
          "Save stable snapshots periodically to prevent sudden data loss"
        ]
      },
      {
        title: `Verify ${cleanedTopic} execution and perform debugging runs`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done in structured, uninterrupted focus blocks",
        whyItMatters: "Catches minor logic flaws, syntax bugs, and format discrepancies before submission.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          `Cross-reference output against all parameters in the ${cleanedTopic} rubric`,
          "Run standard corner cases and handle potential errors or formatting quirks",
          "Format all source code, clean up comments, and fix linting errors"
        ]
      },
      {
        title: `Complete final verification and submit ${cleanedTopic} files`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.1)),
        bestTimeContext: "Best done during daytime hours ahead of the deadline",
        whyItMatters: "Ensures your hard work is registered securely in the system without deadline pressure.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 15,
        reminderRecommendation: "Upload at least 30 minutes early. Server traffic spike can cause late submission errors.",
        checklist: [
          "Package files exactly as described (e.g. naming schema, file extensions)",
          "Perform a final test download and unzip of files to verify completeness",
          "Submit through the portal and download your timestamped receipt"
        ]
      }
    ];
  }

  if (category === 'Hackathon Project') {
    return [
      {
        title: `Define MVP features and setup layout wireframe for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done during your morning focus hours",
        whyItMatters: "Defines clear boundaries for the project, avoiding scope creep in high-pressure hackathons.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 25,
        reminderRecommendation: "",
        checklist: [
          "Lock down exact 3-feature MVP scope and strictly defer other ideas",
          `Sketch user flows and wireframe layouts for ${cleanedTopic}`,
          "Initialize the repository and configure key styling variables"
        ]
      },
      {
        title: `Build responsive client-side UI layouts and navigation for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.3)),
        bestTimeContext: "Best done when creative and visual focus is at its absolute peak",
        whyItMatters: "Creates a highly polished first-impression that captures judges' attention.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          "Build responsive shell layouts, header menus, and tab containers",
          "Implement forms, cards, and data visualization grids",
          "Verify contrast ratios and visual feedback for buttons and inputs"
        ]
      },
      {
        title: `Implement core backend routing and data services for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.35)),
        bestTimeContext: "Best done in deep, silent study or coding sessions",
        whyItMatters: "Powers the application with actual data flow and keeps persistent user state safe.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 60,
        reminderRecommendation: "",
        checklist: [
          "Set up durable state managers with standard LocalStorage backups",
          "Write Express API routers and test JSON inputs/outputs",
          "Integrate model APIs or mock data schemas to handle real inputs"
        ]
      },
      {
        title: `Run end-to-end user path testing and deploy ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.15)),
        bestTimeContext: "Best done during late afternoon review blocks",
        whyItMatters: "Ensures judges can use your live link seamlessly without encountering broken paths.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "Deploy early. Confirm the site builds correctly in clean browser private tabs.",
        checklist: [
          "Test core user scenarios to ensure no unexpected crashes or errors",
          "Build the application and fix any typescript or bundling bugs",
          "Deploy the build to Cloud Run or Vercel and check public accessibility"
        ]
      }
    ];
  }

  if (category === 'Research Project') {
    return [
      {
        title: `Conduct literature review and outline hypothesis for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.25)),
        bestTimeContext: "Best done during your morning focus hours",
        whyItMatters: "Establishes a solid theoretical context, identifying previous studies to ground your project.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 30,
        reminderRecommendation: "",
        checklist: [
          `Search academic engines for top 5 relevant papers on ${cleanedTopic}`,
          "Document core findings, limitations of current studies, and gaps",
          "Formulate your central research question and define target variables"
        ]
      },
      {
        title: `Design experiment methodology and collect initial data`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.35)),
        bestTimeContext: "Best done when analytical focus is peak",
        whyItMatters: "Ensures data collection processes are rigorous and repeatable for publication.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          "Outline step-by-step methodology and secure any required permissions",
          "Collect qualitative responses, run code simulations, or import datasets",
          "Store raw data securely in structured CSV or database tables"
        ]
      },
      {
        title: `Process dataset and analyze results for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.25)),
        bestTimeContext: "Best done during highly analytical daytime sessions",
        whyItMatters: "Transforms raw data points into actionable insights and trend correlations.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 60,
        reminderRecommendation: "",
        checklist: [
          "Clean datasets (remove null values, normalize parameters)",
          "Perform statistical runs and plot scatter/line visualizations",
          "Highlight key data trends and write concise summaries of results"
        ]
      },
      {
        title: `Synthesize findings and compile final research summary`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.15)),
        bestTimeContext: "Best done in reflective quiet focus blocks",
        whyItMatters: "Presents findings clearly, outlining limitations and future paths for readers.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 30,
        reminderRecommendation: "Check bibliography formats carefully against required journal/class templates.",
        checklist: [
          "Draft discussion section answering the initial hypothesis",
          "Document limitations, potential biases, and next steps",
          "Compile a bibliography and format academic citations properly"
        ]
      }
    ];
  }

  if (category === 'Essay / Paper') {
    return [
      {
        title: `Gather sources and outline core arguments for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done during morning brainstorming hours",
        whyItMatters: "Ensures the paper possesses a logical progression of arguments before writing begins.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "",
        checklist: [
          "Define a central thesis statement answering the main essay prompt",
          "Locate 3-5 quote extracts from high-quality sources supporting your thesis",
          "Create a structured outline dividing the paper into logical arguments"
        ]
      },
      {
        title: `Draft introduction paragraph and first major body arguments`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.35)),
        bestTimeContext: "Best done when creative and written flow is high",
        whyItMatters: "Hooks the reader early and builds momentum with your strongest supportive argument.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          "Write a compelling introductory hook concluding with your thesis",
          "Draft the first body block integrating quote analysis and transitions",
          "Check that each paragraph directly anchors back to your main thesis"
        ]
      },
      {
        title: `Complete remaining supportive arguments and draft conclusion`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.3)),
        bestTimeContext: "Best done in focused afternoon writing sweeps",
        whyItMatters: "Binds all loose ends, summarizing main arguments and providing a final synthesis.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          "Draft secondary body arguments detailing complementary perspectives",
          "Address potential counter-arguments to strengthen academic weight",
          "Compose a conclusion synthesizing arguments without introducing new facts"
        ]
      },
      {
        title: `Execute peer-revision, proofreading, and citation sweeps`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.15)),
        bestTimeContext: "Best done during calm evening hours",
        whyItMatters: "Removes grammar issues, refines tone flow, and secures free styling marks.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 30,
        reminderRecommendation: "Run a plagiarism and citation verification pass prior to final upload.",
        checklist: [
          "Review paper flow out loud to identify clunky or verbose sentences",
          "Correct grammar errors, typo oversights, and transition holes",
          "Generate citation references and cross-match formatting style (APA/MLA)"
        ]
      }
    ];
  }

  if (category === 'Interview Preparation') {
    return [
      {
        title: `Refine professional summaries and optimize resume layout`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done in short, highly analytical sessions",
        whyItMatters: "Bypasses automated applicant screening filters to place you in front of real hiring managers.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "",
        checklist: [
          `Audit resume points specifically matching parameters for ${cleanedTopic}`,
          "Convert statements into metric-driven (Accomplished X, measured by Y) achievements",
          "Ensure layout is strictly single-page, clean, and easily scannable"
        ]
      },
      {
        title: `Solve core algorithm puzzles and review behavioral patterns`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.4)),
        bestTimeContext: "Best done during morning peak logic hours",
        whyItMatters: "Builds pattern matching speed for technical assessments and verbal fluency for behavior questions.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 45,
        reminderRecommendation: "",
        checklist: [
          "Attempt 3-5 technical coding challenges (focusing on arrays and hash maps)",
          "Draft 3 behavioral stories structured via STAR method (Situation, Task, Action, Result)",
          "Review fundamental architecture concepts or subject-matter trivia"
        ]
      },
      {
        title: `Rehearse mock responses under timed interview limits`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.25)),
        bestTimeContext: "Best done mid-day to simulate high-pressure environment",
        whyItMatters: "Trains you to think aloud, pacing your solutions clearly while maintaining professional composure.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 30,
        reminderRecommendation: "",
        checklist: [
          "Set a timer for 30 minutes to solve a new challenge without helpers",
          "Record yourself explaining a STAR behavioral answer out loud",
          "Review recordings to fix speaking speed, eye contact, and clarity"
        ]
      },
      {
        title: `Publish application links and send post-interview notes`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.15)),
        bestTimeContext: "Best done during business hours",
        whyItMatters: "Positions you as a highly proactive, organized candidate in the selection pool.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 15,
        reminderRecommendation: "Prepare a brief, friendly follow-up email thanking each interviewer for their time.",
        checklist: [
          "Submit your optimized application files to candidate portals",
          "Verify that your GitHub portfolio and LinkedIn profile links are live",
          "Document tracking details (role, company, date submitted) in a log"
        ]
      }
    ];
  }

  if (category === 'Personal Event') {
    return [
      {
        title: `Finalize guest list and outline budget for ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
        bestTimeContext: "Best done in relaxed evening work blocks",
        whyItMatters: "Secures clear budget borders, avoiding unnecessary personal expenses.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "",
        checklist: [
          "Outline the exact invitee list and send initial save-the-date notifications",
          `Draft a realistic budget breakdown matching your ${cleanedTopic} goals`,
          "Select 3 potential central activities or structural themes for the day"
        ]
      },
      {
        title: `Procure required gifts and coordinate local venue reservations`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.4)),
        bestTimeContext: "Best done during flexible daytime blocks",
        whyItMatters: "Locks down core elements of the day early, preventing shipping delays or venue conflicts.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 30,
        reminderRecommendation: "",
        checklist: [
          "Order special gifts or celebratory items with clear shipping margins",
          "Secure room bookings, reservation desks, or ticket purchases",
          "Compile a shopping checklist for decor, food, or specific logistics"
        ]
      },
      {
        title: `Confirm attendee counts and schedule logistics`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.25)),
        bestTimeContext: "Best done in quick, highly organized review slots",
        whyItMatters: "Coordinates final counts with vendors, avoiding food waste or transport shortages.",
        isTimerEligible: true,
        suggestedWorkBlockMinutes: 20,
        reminderRecommendation: "",
        checklist: [
          "Contact guests who have not RSVP'd to secure an accurate head-count",
          "Create a timeline schedule of the event (e.g. arrival, dinner, activities)",
          "Coordinate transport schedules or group navigation coordinates"
        ]
      },
      {
        title: `Manage active operations on the day of ${cleanedTopic}`,
        durationHours: Math.max(1, Math.round(estimatedHours * 0.15)),
        bestTimeContext: "Executed during the event itself",
        whyItMatters: "Allows you to enjoy the milestone while ensuring everything unfolds without issues.",
        isTimerEligible: false,
        suggestedWorkBlockMinutes: 15,
        reminderRecommendation: "Keep camera fully charged. Put secondary tasks aside to enjoy the milestone.",
        checklist: [
          "Confirm setup parameters with helpers or site staff",
          "Ensure guests are greeted and logistics run according to plan",
          "Distribute brief, polite appreciation messages to participants afterward"
        ]
      }
    ];
  }

  // Custom Goal (Fallback Category)
  return [
    {
      title: `Deconstruct parameters and outline plan for ${cleanedTopic}`,
      durationHours: Math.max(1, Math.round(estimatedHours * 0.2)),
      bestTimeContext: "Best done during your morning focus hours",
      whyItMatters: "Translates abstract target goals into high-yield milestones, clarifying requirements early on.",
      isTimerEligible: true,
      suggestedWorkBlockMinutes: 20,
      reminderRecommendation: "",
      checklist: [
        `Outline clear success criteria and measurable milestones for ${cleanedTopic}`,
        "Gather all required guidelines, files, software tools, or materials",
        "Establish an organized note template or folder structure to catalog progress"
      ]
    },
    {
      title: `Execute primary workload and draft core components of ${cleanedTopic}`,
      durationHours: Math.max(1, Math.round(estimatedHours * 0.5)),
      bestTimeContext: "Best done when focus and analytical energy are peak",
      whyItMatters: "Powers through the hardest segments of the plan first, keeping your momentum high.",
      isTimerEligible: true,
      suggestedWorkBlockMinutes: 45,
      reminderRecommendation: "",
      checklist: [
        "Focus 100% on building the core 50% foundation elements first",
        "Keep details clean and document core solutions or steps",
        "Minimize external interruptions and record your study sessions"
      ]
    },
    {
      title: `Conduct quality review and validate performance on ${cleanedTopic}`,
      durationHours: Math.max(1, Math.round(estimatedHours * 0.3)),
      bestTimeContext: "Best done during structured afternoon blocks",
      whyItMatters: "Verifies the quality of your output, catching errors prior to final completion.",
      isTimerEligible: true,
      suggestedWorkBlockMinutes: 30,
      reminderRecommendation: "",
      checklist: [
        "Compare outcomes against your baseline outline of goals",
        "Tune up formatting details, clear minor glitches, or smooth out flows",
        "Document notes of lessons learned to reuse in future projects"
      ]
    }
  ];
}

// Reusable Task Execution Helpers
export function isTaskTimerEligible(title: string, serverValue?: boolean): boolean {
  if (serverValue !== undefined) return serverValue;
  const text = title.toLowerCase();
  const nonFocusKeywords = [
    'sleep', 'rest', 'bed', 'nap', 'relax', 'wind down',
    'submit', 'upload', 'turn in', 'hand in',
    'attend', 'lecture', 'class', 'seminar', 'webinar',
    'ask', 'professor', 'teacher', 'instructor', 'email', 'ta',
    'post', 'download', 'register', 'sign up'
  ];
  return !nonFocusKeywords.some(keyword => text.includes(keyword));
}

export function getTaskWhyItMatters(title: string, serverValue?: string): string {
  if (serverValue) return serverValue;
  const text = title.toLowerCase();
  if (text.includes('exam') || text.includes('study') || text.includes('test') || text.includes('quiz') || text.includes('questions')) {
    return 'Directly impacts grade. Reinforces core concepts and ensures memory retention under pressure.';
  }
  if (text.includes('sleep') || text.includes('rest') || text.includes('bed') || text.includes('wind down')) {
    return 'Critical for cognitive function, memory consolidation, and keeping focus sharp on exam day.';
  }
  if (text.includes('submit') || text.includes('upload') || text.includes('turn in')) {
    return 'Ensures work is officially registered before the deadline to secure earned marks.';
  }
  if (text.includes('mvp') || text.includes('feature') || text.includes('wireframe') || text.includes('layout')) {
    return 'Defines clear project scope early on, preventing downstream over-engineering.';
  }
  if (text.includes('backend') || text.includes('logic') || text.includes('api') || text.includes('storage')) {
    return 'Establishes core application data pathways, enabling functional state persistence.';
  }
  if (text.includes('ask') || text.includes('professor') || text.includes('email') || text.includes('ta')) {
    return 'Clears up blockers immediately to avoid costly rework or wasted academic effort.';
  }
  if (text.includes('attend') || text.includes('lecture') || text.includes('class')) {
    return 'Key exposure to primary exam-eligible materials and direct guidance from instructor.';
  }
  return 'Lays necessary groundwork to keep you moving efficiently toward your target milestone.';
}

export function getTaskSuggestedDuration(title: string, durationHours: number, serverValue?: number): number {
  if (serverValue !== undefined && serverValue > 0) return serverValue;
  const estMinutes = Math.round(durationHours * 60);
  if (estMinutes <= 0) return 20;
  
  // Suggested slots
  const standardSlots = [10, 15, 20, 30, 45, 60];
  const closest = standardSlots.reduce((prev, curr) => 
    Math.abs(curr - estMinutes) < Math.abs(prev - estMinutes) ? curr : prev
  );
  return closest;
}

export function getTaskReminderRecommendation(title: string, serverValue?: string): string {
  if (serverValue) return serverValue;
  const text = title.toLowerCase();
  if (text.includes('sleep') || text.includes('rest') || text.includes('bed') || text.includes('wind-down') || text.includes('wind down')) {
    return 'Sleep 7–8 hours tonight. Your brain consolidates study material during deep REM cycles.';
  }
  if (text.includes('submit') || text.includes('upload') || text.includes('turn in')) {
    return 'Double-check file format, run final test builds, and submit at least 30 minutes before the official deadline.';
  }
  if (text.includes('attend') || text.includes('lecture') || text.includes('class')) {
    return 'Arrive 5 minutes early, silence notifications, and focus on taking active summary notes.';
  }
  if (text.includes('ask') || text.includes('professor') || text.includes('email')) {
    return 'Keep the query concise, reference specific lecture notes, and suggest times you are free to meet.';
  }
  return 'Review guidelines, check required specifications, and complete this item ahead of schedule.';
}

export function decorateTask(task: Task): Task {
  const isEligible = isTaskTimerEligible(task.title, task.isTimerEligible);
  return {
    ...task,
    isTimerEligible: isEligible,
    whyItMatters: getTaskWhyItMatters(task.title, task.whyItMatters),
    suggestedWorkBlockMinutes: getTaskSuggestedDuration(task.title, task.durationHours, task.suggestedWorkBlockMinutes),
    reminderRecommendation: isEligible ? '' : getTaskReminderRecommendation(task.title, task.reminderRecommendation),
  };
}

interface PlannerContextType {
  goals: Goal[];
  tasks: Task[];
  activeTab: 'today' | 'timeline' | 'recovery';
  setActiveTab: (tab: 'today' | 'timeline' | 'recovery') => void;
  activeTaskId: string | null;
  pomodoro: FocusSession;
  activeRecovery: RecoveryRecommendation | null;
  isGeneratingTasks: boolean;
  isGeneratingRecovery: boolean;
  isGeneratingDraft: string | null; // Stores subtask itemId currently being generated to show custom spinners
  apiWarning: string | null;
  gamification: GamificationState;
  completionHistory: CompletionHistory;
  toast: ToastState | null;
  setToast: (toast: ToastState | null) => void;
  addGoal: (name: string, description: string, deadline: string, estimatedHours: number, priority: 'low' | 'medium' | 'high') => Promise<void>;
  deleteGoal: (id: string) => void;
  toggleTask: (taskId: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  startFocus: (taskId: string, durationMinutes?: number) => void;
  pauseFocus: () => void;
  resetFocus: () => void;
  requestRecoveryPlan: (goalId: string, options?: { background?: boolean }) => Promise<void>;
  applyRecoveryPlan: () => void;
  discardRecoveryPlan: () => void;
  generateSubtaskDraft: (taskId: string, itemId: string, subtaskText: string) => Promise<void>;
  triggerAudioChime: (type: 'complete' | 'levelUp') => void;
  blockers: BlockerRecord[];
  logBlocker: (goalId: string, taskId: string, blockerType: BlockerType, optionalNote?: string) => void;
  deleteBlocker: (blockerId: string) => void;
  moveTaskToTomorrow: (taskId: string) => void;
  splitMilestone: (taskId: string) => void;
  reduceWorkload: (taskId: string) => void;
  extendGoalDeadline: (goalId: string, days: number) => void;
  regenerateChecklist: (taskId: string) => Promise<void>;
  calendarToken: string | null;
  isCalendarConnected: boolean;
  calendarEvents: any[];
  isSandboxMode: boolean;
  connectCalendar: () => Promise<void>;
  disconnectCalendar: () => void;
  setSandboxMode: (active: boolean) => void;
  fetchCalendarEvents: () => Promise<void>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

// Initial seed data to showcase the app layout
const SEED_GOALS: Goal[] = [
  {
    id: 'seed-goal-1',
    name: 'Build AI Hackathon Project',
    description: 'A responsive full-stack prototype of a calendar schedule manager integrating Google Gemini, Web Audio context, and dynamic progress metrics.',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days left
    estimatedHours: 12,
    priority: 'high',
    status: 'at-risk', // 12 hours / 2 days = 6 hrs/day load (at-risk)
    createdAt: new Date().toISOString()
  }
];

const SEED_TASKS: Task[] = [
  {
    id: 'seed-task-1',
    goalId: 'seed-goal-1',
    title: 'Define MVP features and setup layout wireframe',
    completed: false,
    durationHours: 3,
    bestTimeContext: 'Best done during your morning focus hours',
    checklist: [
      { id: 'c1', text: 'Lock down exact 3-feature MVP scope and exclude secondary features', completed: true },
      { id: 'c2', text: 'Sketch simple user flows on paper or online editor', completed: false },
      { id: 'c3', text: 'Set up clean React + Vite workspace with Tailwind', completed: false }
    ]
  },
  {
    id: 'seed-task-2',
    goalId: 'seed-goal-1',
    title: 'Build responsive client-side UI layouts and navigation',
    completed: false,
    durationHours: 4,
    bestTimeContext: 'Best done when your creative energy is peak',
    checklist: [
      { id: 'c4', text: 'Build app shell, header, and clean tabs for core views', completed: false },
      { id: 'c5', text: 'Implement form controls and interactive charts', completed: false },
      { id: 'c6', text: 'Verify visual layout, fonts, and responsive grid layouts', completed: false }
    ]
  },
  {
    id: 'seed-task-3',
    goalId: 'seed-goal-1',
    title: 'Implement core backend logic and API services',
    completed: false,
    durationHours: 5,
    bestTimeContext: 'Best done during your peak focus hours',
    checklist: [
      { id: 'c7', text: 'Setup state managers with durable localStorage persistence', completed: false },
      { id: 'c8', text: 'Write server-side API request handlers', completed: false },
      { id: 'c9', text: 'Add validation guards for input forms', completed: false }
    ]
  }
];

const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
};

const triggerAudioChime = (type: 'complete' | 'levelUp') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    if (type === 'complete') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now + 0.08);
      
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } else if (type === 'levelUp') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        
        gainNode.gain.setValueAtTime(0.12, now + index * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.5);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.5);
      });
    }
  } catch (e) {
    console.warn("Audio chime failed to play: Web Audio context may be blocked by user gesture restrictions.", e);
  }
};

const computeGoalScheduleSignature = (goalId: string, allGoals: Goal[], allTasks: Task[]) => {
  const goal = allGoals.find(g => g.id === goalId);
  if (!goal) return '';
  const goalTasks = allTasks
    .filter(t => t.goalId === goalId)
    .map(t => `${t.id}-${t.completed}-${t.durationHours}-${t.title}`)
    .sort()
    .join('|');
  return `${goal.id}|${goal.deadline}|${goal.estimatedHours}|${goalTasks}`;
};

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'timeline' | 'recovery'>('today');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeRecovery, setActiveRecovery] = useState<RecoveryRecommendation | null>(null);

  // Google Calendar States
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>(SANDBOX_EVENTS);
  const [isSandboxMode, setIsSandboxModeState] = useState<boolean>(true);

  const connectCalendar = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCalendarToken(res.accessToken);
        setIsCalendarConnected(true);
        setIsSandboxModeState(false);
        const events = await fetchGoogleEvents(res.accessToken);
        setCalendarEvents(events);
        setToast({
          id: `cal-success-${Date.now()}`,
          title: "Calendar Connected",
          message: "Successfully retrieved your Google Calendar events.",
          type: "success"
        });
      }
    } catch (e: any) {
      console.error("Google Calendar connection failed:", e);
      const isPopupError = 
        e?.code === 'auth/popup-closed-by-user' || 
        e?.message?.includes('closed') || 
        e?.message?.includes('popup') ||
        e?.message?.includes('iframe');
      
      setToast({
        id: `cal-err-${Date.now()}`,
        title: isPopupError ? "Popup Blocked or Closed" : "Connection Failed",
        message: e?.message || "Failed to connect to Google Calendar. Please check your credentials.",
        type: "error"
      });
    }
  };

  const disconnectCalendar = () => {
    googleSignOut().catch(console.error);
    setCalendarToken(null);
    setIsCalendarConnected(false);
    setCalendarEvents(isSandboxMode ? SANDBOX_EVENTS : []);
    setToast({
      id: `cal-disconnected-${Date.now()}`,
      title: "Calendar Disconnected",
      message: "Disconnected from Google Calendar.",
      type: "success"
    });
  };

  const setSandboxMode = (active: boolean) => {
    setIsSandboxModeState(active);
    if (active) {
      setCalendarEvents(SANDBOX_EVENTS);
    } else {
      if (!isCalendarConnected) {
        setCalendarEvents([]);
      } else if (calendarToken) {
        fetchGoogleEvents(calendarToken)
          .then(events => setCalendarEvents(events))
          .catch(console.error);
      }
    }
  };

  const fetchCalendarEvents = async () => {
    if (isSandboxMode) {
      setCalendarEvents(SANDBOX_EVENTS);
      return;
    }
    if (!calendarToken) return;
    try {
      const events = await fetchGoogleEvents(calendarToken);
      setCalendarEvents(events);
    } catch (e) {
      console.error("Fetch calendar events failed:", e);
    }
  };

  const updateActiveRecovery = (rec: RecoveryRecommendation | null) => {
    setActiveRecovery(rec);
    if (rec) {
      localStorage.setItem('guardian_active_recovery', JSON.stringify(rec));
    } else {
      localStorage.removeItem('guardian_active_recovery');
    }
  };
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isGeneratingRecovery, setIsGeneratingRecovery] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<BlockerRecord[]>([]);

  // Recalculate Timeline Status dynamically based on arithmetic study load and blocker-adapted multiplier
  const recalculateGoalStatus = (goal: Goal, allTasks: Task[], blockersList: BlockerRecord[] = blockers): TimelineStatus => {
    const totalGoalTasks = allTasks.filter(t => t.goalId === goal.id);
    const goalTasks = allTasks.filter(t => t.goalId === goal.id && !t.completed);
    
    const progress = totalGoalTasks.length === 0 ? 0 : Math.round(((totalGoalTasks.length - goalTasks.length) / totalGoalTasks.length) * 100);
    const remainingHours = goalTasks.reduce((sum, t) => sum + t.durationHours, 0);

    // If a goal has 100% completion or 0 remaining work hours, automatically mark it as completed
    if (totalGoalTasks.length > 0 && (progress === 100 || remainingHours === 0)) {
      return 'completed';
    }

    if (goal.status === 'completed') {
      return 'completed';
    }

    if (goalTasks.length === 0) return 'on-track';

    const deadlineDate = new Date(goal.deadline + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const msDiff = deadlineDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return 'at-risk';
    }

    // Adaptively scale remaining hours based on blocker learning engine
    const multiplier = getAdaptiveDurationMultiplier(blockersList);
    const adaptiveHours = remainingHours * multiplier;
    const dailyLoadRequired = adaptiveHours / daysLeft;

    if (dailyLoadRequired <= 1.5) {
      return 'on-track';
    } else if (dailyLoadRequired <= 3.0) {
      return 'slightly-behind';
    } else {
      return 'at-risk';
    }
  };

  const updateAllGoalStatuses = (allGoals: Goal[], allTasks: Task[], blockersList: BlockerRecord[] = blockers): Goal[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = allGoals.map(g => {
      const nextStatus = recalculateGoalStatus(g, allTasks, blockersList);
      const isCompleted = nextStatus === 'completed';
      const wasCompleted = g.status === 'completed';
      
      let completedAt = g.completedAt;
      if (isCompleted && !wasCompleted) {
        completedAt = todayStr;
      } else if (!isCompleted) {
        completedAt = undefined;
      }

      return {
        ...g,
        status: nextStatus,
        completedAt
      };
    });
    return updated;
  };

  const [gamification, setGamification] = useState<GamificationState>({
    xp: 0,
    level: 1,
    streak: 0,
    lastCompletedDate: null,
    totalTasksCompleted: 0,
    totalSubtasksCompleted: 0
  });

  const [completionHistory, setCompletionHistory] = useState<CompletionHistory>({});
  const [toast, setToast] = useState<ToastState | null>(null);

  const [pomodoro, setPomodoro] = useState<FocusSession>({
    taskId: null,
    isRunning: false,
    secondsRemaining: 25 * 60,
    totalSeconds: 25 * 60,
    isBreak: false,
    completedCount: 0
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedGoals = localStorage.getItem('guardian_goals');
    const savedTasks = localStorage.getItem('guardian_tasks');
    const savedGamification = localStorage.getItem('guardian_gamification');
    const savedBlockers = localStorage.getItem('guardian_blockers');
    const savedCompletionHistory = localStorage.getItem('guardian_completion_history');
    
    if (savedCompletionHistory) {
      setCompletionHistory(JSON.parse(savedCompletionHistory));
    }

    let loadedBlockers: BlockerRecord[] = [];
    if (savedBlockers) {
      loadedBlockers = JSON.parse(savedBlockers);
      setBlockers(loadedBlockers);
    } else {
      const seedBlockers: BlockerRecord[] = [
        {
          id: 'seed-blocker-1',
          goalId: 'seed-goal-1',
          taskId: 'seed-task-1',
          blockerType: 'not_enough_time',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          optionalNote: 'Struggled with research because of afternoon physics lab.'
        },
        {
          id: 'seed-blocker-2',
          goalId: 'seed-goal-1',
          taskId: 'seed-task-2',
          blockerType: 'got_distracted',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          optionalNote: 'Study group got chatty on social media.'
        }
      ];
      setBlockers(seedBlockers);
      localStorage.setItem('guardian_blockers', JSON.stringify(seedBlockers));
      loadedBlockers = seedBlockers;
    }

    if (savedGoals && savedTasks) {
      const parsedGoals = JSON.parse(savedGoals);
      const parsedTasks = JSON.parse(savedTasks) as Task[];
      const decoratedTasks = parsedTasks.map(decorateTask);
      const withStatus = updateAllGoalStatuses(parsedGoals, decoratedTasks, loadedBlockers);
      setGoals(withStatus);
      setTasks(decoratedTasks);
      // Save recalculated statuses back to local storage
      localStorage.setItem('guardian_goals', JSON.stringify(withStatus));
      localStorage.setItem('guardian_tasks', JSON.stringify(decoratedTasks));
    } else {
      // Seed initial data so they are not faced with a blank slate
      const withStatus = updateAllGoalStatuses(SEED_GOALS, SEED_TASKS.map(decorateTask), loadedBlockers);
      setGoals(withStatus);
      const decoratedSeed = SEED_TASKS.map(decorateTask);
      setTasks(decoratedSeed);
      localStorage.setItem('guardian_goals', JSON.stringify(withStatus));
      localStorage.setItem('guardian_tasks', JSON.stringify(decoratedSeed));
    }

    if (savedGamification) {
      const parsed = JSON.parse(savedGamification);
      const todayStr = getLocalDateString();
      const yesterdayStr = getYesterdayDateString();
      
      if (parsed.lastCompletedDate && parsed.lastCompletedDate !== todayStr && parsed.lastCompletedDate !== yesterdayStr) {
        parsed.streak = 0;
      }
      setGamification(parsed);
    }

    const savedActiveRecovery = localStorage.getItem('guardian_active_recovery');
    if (savedActiveRecovery) {
      try {
        setActiveRecovery(JSON.parse(savedActiveRecovery));
      } catch (e) {
        console.error('Error loading active recovery:', e);
      }
    }
  }, []);

  // 1. Signature expiration check effect
  useEffect(() => {
    if (activeRecovery && activeRecovery.status !== 'EXPIRED' && activeRecovery.status !== 'APPLIED' && activeRecovery.status !== 'DISMISSED') {
      const currentSig = computeGoalScheduleSignature(activeRecovery.goalId, goals, tasks);
      if (activeRecovery.scheduleSignature && activeRecovery.scheduleSignature !== currentSig) {
        console.log('Schedule changed relative to active proposal. Setting to EXPIRED.');
        updateActiveRecovery({
          ...activeRecovery,
          status: 'EXPIRED'
        });
      }
    } else if (activeRecovery && (activeRecovery.status === 'APPLIED' || activeRecovery.status === 'DISMISSED')) {
      const currentSig = computeGoalScheduleSignature(activeRecovery.goalId, goals, tasks);
      if (activeRecovery.scheduleSignature && activeRecovery.scheduleSignature !== currentSig) {
        console.log('Schedule changed after decision. Clearing active recovery.');
        updateActiveRecovery(null);
      }
    }
  }, [goals, tasks, activeRecovery]);

  // 2. Background recovery generation effect
  useEffect(() => {
    if (isGeneratingRecovery) return;

    // Find the first goal that is behind ('at-risk' or 'slightly-behind')
    const behindGoal = goals.find(g => g.status === 'at-risk' || g.status === 'slightly-behind');
    if (!behindGoal) {
      if (activeRecovery && activeRecovery.status !== 'APPLIED' && activeRecovery.status !== 'DISMISSED') {
        updateActiveRecovery(null);
      }
      return;
    }

    const needsNewProposal = !activeRecovery || 
                             activeRecovery.goalId !== behindGoal.id || 
                             activeRecovery.status === 'EXPIRED';

    if (needsNewProposal) {
      console.log('Automatically generating fresh recovery plan for goal:', behindGoal.name);
      requestRecoveryPlan(behindGoal.id, { background: true });
    }
  }, [goals, tasks, activeRecovery]);

  // 3. Mark PENDING_REVIEW as REVIEWED when user enters the recovery tab
  useEffect(() => {
    if (activeTab === 'recovery' && activeRecovery && activeRecovery.status === 'PENDING_REVIEW') {
      console.log('User entered recovery tab. Transitioning status to REVIEWED.');
      updateActiveRecovery({
        ...activeRecovery,
        status: 'REVIEWED'
      });
    }
  }, [activeTab, activeRecovery]);

  // Save to local storage whenever state changes
  const saveState = (updatedGoals: Goal[], updatedTasks: Task[]) => {
    localStorage.setItem('guardian_goals', JSON.stringify(updatedGoals));
    localStorage.setItem('guardian_tasks', JSON.stringify(updatedTasks));
  };

  // 1. Goal Creation
  const addGoal = async (name: string, description: string, deadline: string, estimatedHours: number, priority: 'low' | 'medium' | 'high') => {
    setIsGeneratingTasks(true);
    setApiWarning(null);
    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, deadline, estimatedHours, priority })
      });
      const data = await response.json();
      
      if (data.warning) {
        setApiWarning(data.warning);
      }

      const generatedTasks: any[] = data.tasks || [];
      const planSource: 'ai' | 'fallback_ai' | 'local' = data.planSource || 'local';
      const newGoalId = 'goal-' + Math.random().toString(36).substr(2, 9);
      
      const newGoal: Goal = {
        id: newGoalId,
        name,
        description,
        deadline,
        estimatedHours,
        priority,
        status: 'on-track', // temporary, will compute
        createdAt: new Date().toISOString(),
        planSource
      };

      const newTasks: Task[] = generatedTasks.map((t, idx) => decorateTask({
        id: `task-${newGoalId}-${idx}`,
        goalId: newGoalId,
        title: t.title,
        completed: false,
        durationHours: t.durationHours || 2,
        bestTimeContext: t.bestTimeContext || 'Best done during your peak focus hours',
        checklist: (t.checklist || []).map((c: string, cIdx: number) => ({
          id: `checklist-${newGoalId}-${idx}-${cIdx}`,
          text: c,
          completed: false
        })),
        whyItMatters: t.whyItMatters,
        isTimerEligible: t.isTimerEligible,
        suggestedWorkBlockMinutes: t.suggestedWorkBlockMinutes,
        reminderRecommendation: t.reminderRecommendation
      }));

      const nextTasks = [...tasks, ...newTasks];
      const withStatus = updateAllGoalStatuses([...goals, newGoal], nextTasks);
      
      setGoals(withStatus);
      setTasks(nextTasks);
      saveState(withStatus, nextTasks);

    } catch (error) {
      console.error('Error in addGoal action (gracefully falling back to client-side smart local planner):', error);
      
      // Smart Client-Side Resilient Fallback
      setApiWarning("Guardian generated a smart backup plan locally because the planner server is currently unreachable.");
      
      const generatedTasks = getMockTasksClient(name, estimatedHours, description);
      const newGoalId = 'goal-' + Math.random().toString(36).substr(2, 9);
      
      const newGoal: Goal = {
        id: newGoalId,
        name,
        description,
        deadline,
        estimatedHours,
        priority,
        status: 'on-track', // temporary, will compute
        createdAt: new Date().toISOString(),
        planSource: 'local'
      };

      const newTasks: Task[] = generatedTasks.map((t, idx) => decorateTask({
        id: `task-${newGoalId}-${idx}`,
        goalId: newGoalId,
        title: t.title,
        completed: false,
        durationHours: t.durationHours || 2,
        bestTimeContext: t.bestTimeContext || 'Best done during your peak focus hours',
        checklist: (t.checklist || []).map((c: string, cIdx: number) => ({
          id: `checklist-${newGoalId}-${idx}-${cIdx}`,
          text: c,
          completed: false
        })),
        whyItMatters: t.whyItMatters,
        isTimerEligible: t.isTimerEligible,
        suggestedWorkBlockMinutes: t.suggestedWorkBlockMinutes,
        reminderRecommendation: t.reminderRecommendation
      }));

      const nextTasks = [...tasks, ...newTasks];
      const withStatus = updateAllGoalStatuses([...goals, newGoal], nextTasks);
      
      setGoals(withStatus);
      setTasks(nextTasks);
      saveState(withStatus, nextTasks);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // 2. Delete Goal
  const deleteGoal = (id: string) => {
    const nextGoals = goals.filter(g => g.id !== id);
    const nextTasks = tasks.filter(t => t.goalId !== id);
    const withStatus = updateAllGoalStatuses(nextGoals, nextTasks);

    if (activeTaskId && tasks.find(t => t.id === activeTaskId)?.goalId === id) {
      setActiveTaskId(null);
      setPomodoro(prev => ({ ...prev, taskId: null, isRunning: false }));
    }

    setGoals(withStatus);
    setTasks(nextTasks);
    saveState(withStatus, nextTasks);
    if (activeRecovery?.goalId === id) {
      updateActiveRecovery(null);
    }
  };

  const handleItemCompleted = (isChecklist: boolean, isUndo: boolean) => {
    let nextStreak = 0;
    let prevLevel = 1;
    let newLevel = 1;

    setGamification(prev => {
      const xpIncrement = isChecklist ? 12 : 40;
      const calculatedXp = isUndo ? Math.max(0, prev.xp - xpIncrement) : prev.xp + xpIncrement;
      
      newLevel = Math.floor(calculatedXp / 100) + 1;
      prevLevel = prev.level;
      const leveledUp = newLevel > prev.level && !isUndo;
      
      let nextStrk = prev.streak;
      let nextLastCompletedDate = prev.lastCompletedDate;
      
      if (!isUndo) {
        const todayStr = getLocalDateString();
        const yesterdayStr = getYesterdayDateString();
        
        if (!prev.lastCompletedDate) {
          nextStrk = 1;
          nextLastCompletedDate = todayStr;
        } else if (prev.lastCompletedDate === yesterdayStr) {
          nextStrk = prev.streak + 1;
          nextLastCompletedDate = todayStr;
        } else if (prev.lastCompletedDate === todayStr) {
          // Already completed something today
          nextLastCompletedDate = todayStr;
        } else {
          // Streak broken but starts again
          nextStrk = 1;
          nextLastCompletedDate = todayStr;
        }
      }
      
      nextStreak = nextStrk;

      const updated: GamificationState = {
        xp: calculatedXp,
        level: newLevel,
        streak: nextStrk,
        lastCompletedDate: nextLastCompletedDate,
        totalTasksCompleted: prev.totalTasksCompleted + (!isChecklist && !isUndo ? 1 : 0),
        totalSubtasksCompleted: prev.totalSubtasksCompleted + (isChecklist && !isUndo ? 1 : 0),
      };
      
      localStorage.setItem('guardian_gamification', JSON.stringify(updated));
      
      if (leveledUp) {
        triggerAudioChime('levelUp');
      } else if (!isUndo) {
        triggerAudioChime('complete');
      }
      
      return updated;
    });

    // Update daily completion history
    const todayStr = getLocalDateString();
    setCompletionHistory(prevHistory => {
      const currentDay = prevHistory[todayStr] || { milestonesCompleted: 0, subtasksCompleted: 0 };
      let newMilestones = currentDay.milestonesCompleted;
      let newSubtasks = currentDay.subtasksCompleted;

      if (isChecklist) {
        newSubtasks = isUndo ? Math.max(0, newSubtasks - 1) : newSubtasks + 1;
      } else {
        newMilestones = isUndo ? Math.max(0, newMilestones - 1) : newMilestones + 1;
      }

      const updatedHistory = {
        ...prevHistory,
        [todayStr]: {
          milestonesCompleted: newMilestones,
          subtasksCompleted: newSubtasks
        }
      };
      localStorage.setItem('guardian_completion_history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });

    // Trigger celebration toast for milestone completions
    if (!isChecklist && !isUndo) {
      const xpIncrement = 40;
      const nextToast = {
        title: 'Milestone Completed',
        xp: xpIncrement,
        streak: nextStreak || 1,
        levelFrom: prevLevel,
        levelTo: newLevel
      };
      setToast(nextToast);
      setTimeout(() => {
        setToast(curr => curr === nextToast ? null : curr);
      }, 3000);
    }
  };

  // 3. Toggle Task Completion
  const toggleTask = (taskId: string) => {
    let wasCompleted = false;
    let becameCompleted = false;

    const nextTasks = tasks.map(t => {
      if (t.id === taskId) {
        wasCompleted = t.completed;
        becameCompleted = !t.completed;
        return {
          ...t,
          completed: becameCompleted,
          checklist: t.checklist.map(c => ({ ...c, completed: becameCompleted }))
        };
      }
      return t;
    });

    const withStatus = updateAllGoalStatuses(goals, nextTasks);
    setTasks(nextTasks);
    setGoals(withStatus);
    saveState(withStatus, nextTasks);

    if (becameCompleted !== wasCompleted) {
      handleItemCompleted(false, !becameCompleted);
    }

    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setPomodoro(prev => ({ ...prev, taskId: null, isRunning: false }));
    }
  };

  // 4. Toggle Subtask Checklist Item
  const toggleChecklistItem = (taskId: string, itemId: string) => {
    let wasItemCompleted = false;
    let becameItemCompleted = false;
    let wasTaskCompleted = false;
    let becameTaskCompleted = false;

    const nextTasks = tasks.map(t => {
      if (t.id === taskId) {
        wasTaskCompleted = t.completed;
        const nextChecklist = t.checklist.map(c => {
          if (c.id === itemId) {
            wasItemCompleted = c.completed;
            becameItemCompleted = !c.completed;
            return { ...c, completed: becameItemCompleted };
          }
          return c;
        });
        becameTaskCompleted = nextChecklist.every(c => c.completed);
        return {
          ...t,
          checklist: nextChecklist,
          completed: becameTaskCompleted
        };
      }
      return t;
    });

    const withStatus = updateAllGoalStatuses(goals, nextTasks);
    setTasks(nextTasks);
    setGoals(withStatus);
    saveState(withStatus, nextTasks);

    if (becameItemCompleted !== wasItemCompleted) {
      handleItemCompleted(true, !becameItemCompleted);
    }

    if (becameTaskCompleted && !wasTaskCompleted) {
      handleItemCompleted(false, false);
    } else if (!becameTaskCompleted && wasTaskCompleted) {
      handleItemCompleted(false, true);
    }
  };

  // 5. Pomodoro Focus Timers
  const startFocus = (taskId: string, durationMinutes?: number) => {
    setActiveTaskId(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    const suggestedMins = task?.suggestedWorkBlockMinutes || Math.round((task?.durationHours || 0.5) * 60) || 25;
    const mins = durationMinutes !== undefined ? durationMinutes : suggestedMins;
    const secs = mins * 60;

    setPomodoro(prev => ({
      ...prev,
      taskId,
      secondsRemaining: secs,
      totalSeconds: secs,
      isRunning: true,
      isBreak: false
    }));
  };

  const pauseFocus = () => {
    setPomodoro(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resetFocus = () => {
    setPomodoro(prev => {
      let mins = 25;
      if (prev.taskId) {
        const task = tasks.find(t => t.id === prev.taskId);
        mins = task?.suggestedWorkBlockMinutes || Math.round((task?.durationHours || 0.5) * 60) || 25;
      }
      const secs = prev.isBreak ? 5 * 60 : mins * 60;
      return {
        ...prev,
        isRunning: false,
        secondsRemaining: secs,
        totalSeconds: secs
      };
    });
  };

  useEffect(() => {
    if (pomodoro.isRunning) {
      timerRef.current = setInterval(() => {
        setPomodoro(prev => {
          if (prev.secondsRemaining <= 1) {
            // Timer finished!
            const nextIsBreak = !prev.isBreak;
            let nextSeconds = 5 * 60; // default 5 min break
            if (!nextIsBreak && prev.taskId) {
              const task = tasks.find(t => t.id === prev.taskId);
              const mins = task?.suggestedWorkBlockMinutes || Math.round((task?.durationHours || 0.5) * 60) || 25;
              nextSeconds = mins * 60;
            }
            return {
              ...prev,
              isBreak: nextIsBreak,
              secondsRemaining: nextSeconds,
              totalSeconds: nextSeconds,
              isRunning: false,
              completedCount: nextIsBreak ? prev.completedCount + 1 : prev.completedCount
            };
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pomodoro.isRunning, tasks]);

  // 6. Recovery Engine - Requests suggestions
  const requestRecoveryPlan = async (goalId: string, options?: { background?: boolean }) => {
    if (!options?.background) {
      setIsGeneratingRecovery(true);
    }
    try {
      const targetGoal = goals.find(g => g.id === goalId);
      if (!targetGoal || targetGoal.status === 'completed') return;

      const remainingGoalTasks = tasks.filter(t => t.goalId === goalId && !t.completed);
      const totalRemainingHours = remainingGoalTasks.reduce((sum, t) => sum + t.durationHours, 0);

      const deadlineDate = new Date(targetGoal.deadline + 'T23:59:59');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const msDiff = deadlineDate.getTime() - today.getTime();
      const daysLeft = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

      // Calculate calendar overlaps/availability
      const targetDateStr = '2026-06-27';
      const availability = calculateAvailableHours(calendarEvents, targetDateStr);

      const response = await fetch('/api/generate-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalName: targetGoal.name,
          goalDescription: targetGoal.description || '',
          remainingTasks: remainingGoalTasks,
          estimatedHours: totalRemainingHours,
          daysLeft: daysLeft,
          calendarAvailability: {
            availableHours: availability.availableHours,
            conflictMinutes: availability.conflictMinutes,
            conflictingEvents: availability.conflictingEvents
          }
        })
      });

      const data = await response.json();
      
      const sig = computeGoalScheduleSignature(goalId, goals, tasks);
      const newVersion = (activeRecovery && activeRecovery.goalId === goalId) 
        ? activeRecovery.proposalVersion + 1 
        : 1;

      const newRec: RecoveryRecommendation = {
        id: `rec-${goalId}-${Date.now()}`,
        goalId,
        scopeReduction: data.scopeReduction,
        condensedSchedule: data.condensedSchedule,
        timeSavedHours: data.timeSavedHours || 2,
        created: Date.now(),
        proposalVersion: newVersion,
        status: 'PENDING_REVIEW',
        scheduleSignature: sig,
        rearrangedTasks: (data.rearrangedTasks || []).map((rt: any) => {
          // Find matching task id
          const foundTask = remainingGoalTasks.find(t => t.title.toLowerCase().includes(rt.taskTitle.toLowerCase()) || rt.taskTitle.toLowerCase().includes(t.title.toLowerCase()));
          return {
            taskId: foundTask ? foundTask.id : '',
            action: rt.action || 'keep',
            newHours: rt.newHours
          };
        }).filter((rt: any) => rt.taskId !== '') // keep only valid matches
      };

      updateActiveRecovery(newRec);
      if (!options?.background) {
        setActiveTab('recovery');
      }

    } catch (error) {
      console.error('Error generating recovery plan:', error);
    } finally {
      if (!options?.background) {
        setIsGeneratingRecovery(false);
      }
    }
  };

  // Apply Recovery suggestions directly into local task list
  const applyRecoveryPlan = () => {
    if (!activeRecovery) return;

    const nextTasks = tasks.map(t => {
      if (t.goalId === activeRecovery.goalId) {
        const change = activeRecovery.rearrangedTasks.find(rt => rt.taskId === t.id);
        if (change) {
          if (change.action === 'skip') {
            return {
              ...t,
              completed: true, // Auto-mark completed to clear workload
              durationHours: 0
            };
          } else if (change.action === 'reduce' && change.newHours !== undefined) {
            return {
              ...t,
              durationHours: change.newHours,
              title: `${t.title} [Condensed]`
            };
          }
        }
      }
      return t;
    });

    const withStatus = updateAllGoalStatuses(goals, nextTasks);
    setTasks(nextTasks);
    setGoals(withStatus);
    saveState(withStatus, nextTasks);

    const postSig = computeGoalScheduleSignature(activeRecovery.goalId, withStatus, nextTasks);
    const updatedRec: RecoveryRecommendation = {
      ...activeRecovery,
      status: 'APPLIED',
      scheduleSignature: postSig
    };
    updateActiveRecovery(updatedRec);

    setToast({
      title: '✓ Recovery plan applied successfully.',
      xp: 40,
      streak: gamification.streak,
      levelFrom: gamification.level,
      levelTo: gamification.level
    });

    setActiveTab('today');
  };

  const discardRecoveryPlan = () => {
    if (!activeRecovery) return;
    const currentSig = computeGoalScheduleSignature(activeRecovery.goalId, goals, tasks);
    const updatedRec: RecoveryRecommendation = {
      ...activeRecovery,
      status: 'DISMISSED',
      scheduleSignature: currentSig
    };
    updateActiveRecovery(updatedRec);
    setActiveTab('today');
  };

  const generateSubtaskDraft = async (taskId: string, itemId: string, subtaskText: string) => {
    setIsGeneratingDraft(itemId);
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      const goalObj = goals.find(g => g.id === taskObj?.goalId);
      const response = await fetch('/api/generate-subtask-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalName: goalObj?.name || 'Academic Requirement',
          goalDescription: goalObj?.description || '',
          taskTitle: taskObj?.title || 'Study Milestone',
          subtaskText: subtaskText
        })
      });
      const data = await response.json();
      const draftText = data.draft || '';

      const nextTasks = tasks.map(t => {
        if (t.id === taskId) {
          const updatedDrafts = { ...(t.drafts || {}), [itemId]: draftText };
          return {
            ...t,
            drafts: updatedDrafts
          };
        }
        return t;
      });

      setTasks(nextTasks);
      saveState(goals, nextTasks);
    } catch (err) {
      console.error('Error generating subtask draft:', err);
    } finally {
      setIsGeneratingDraft(null);
    }
  };

  const logBlocker = (goalId: string, taskId: string, blockerType: BlockerType, optionalNote?: string) => {
    const newRecord: BlockerRecord = {
      id: 'blocker-' + Date.now(),
      goalId,
      taskId,
      blockerType,
      timestamp: new Date().toISOString(),
      optionalNote
    };
    
    const nextBlockers = [...blockers, newRecord];
    setBlockers(nextBlockers);
    localStorage.setItem('guardian_blockers', JSON.stringify(nextBlockers));

    // Mark the task as completed when skipped/blocked so there is no guilt
    const nextTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: true,
          checklist: t.checklist.map(c => ({ ...c, completed: true }))
        };
      }
      return t;
    });

    const withStatus = updateAllGoalStatuses(goals, nextTasks, nextBlockers);
    setTasks(nextTasks);
    setGoals(withStatus);
    saveState(withStatus, nextTasks);

    triggerAudioChime('complete');
  };

  const deleteBlocker = (blockerId: string) => {
    const nextBlockers = blockers.filter(b => b.id !== blockerId);
    setBlockers(nextBlockers);
    localStorage.setItem('guardian_blockers', JSON.stringify(nextBlockers));

    const withStatus = updateAllGoalStatuses(goals, tasks, nextBlockers);
    setGoals(withStatus);
    saveState(withStatus, tasks);
  };

  const moveTaskToTomorrow = (taskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isDeferred: true } : t);
    setTasks(updatedTasks);
    saveState(goals, updatedTasks);
  };

  const splitMilestone = (taskId: string) => {
    const taskToSplit = tasks.find(t => t.id === taskId);
    if (!taskToSplit) return;
    
    const halfDuration = Math.max(0.5, Math.round((taskToSplit.durationHours / 2) * 10) / 10);
    const midPoint = Math.ceil(taskToSplit.checklist.length / 2);
    const checklist1 = taskToSplit.checklist.slice(0, midPoint);
    const checklist2 = taskToSplit.checklist.slice(midPoint);
    
    const task1: Task = {
      ...taskToSplit,
      id: `${taskToSplit.id}-part1`,
      title: `${taskToSplit.title} (Part 1)`,
      durationHours: halfDuration,
      checklist: checklist1
    };
    
    const task2: Task = {
      ...taskToSplit,
      id: `${taskToSplit.id}-part2`,
      title: `${taskToSplit.title} (Part 2)`,
      durationHours: halfDuration,
      checklist: checklist2.map((c, i) => ({ ...c, id: `${c.id}-part2-${i}` })),
      isDeferred: true // pushes it to tomorrow
    };
    
    const updatedTasks = tasks.reduce((acc: Task[], t) => {
      if (t.id === taskId) {
        acc.push(task1, task2);
      } else {
        acc.push(t);
      }
      return acc;
    }, []);
    
    setTasks(updatedTasks);
    saveState(goals, updatedTasks);
  };

  const reduceWorkload = (taskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const newDuration = Math.max(0.5, Math.round(t.durationHours * 0.6 * 10) / 10);
        const trimmedChecklist = t.checklist.slice(0, Math.max(1, Math.ceil(t.checklist.length * 0.6)));
        return {
          ...t,
          title: t.title.endsWith(" (Streamlined)") ? t.title : `${t.title} (Streamlined)`,
          durationHours: newDuration,
          checklist: trimmedChecklist
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    saveState(goals, updatedTasks);
  };

  const extendGoalDeadline = (goalId: string, days: number) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const currentDeadline = new Date(g.deadline);
        currentDeadline.setDate(currentDeadline.getDate() + days);
        const newDeadlineStr = currentDeadline.toISOString().split('T')[0];
        return {
          ...g,
          deadline: newDeadlineStr
        };
      }
      return g;
    });
    
    const withStatus = updateAllGoalStatuses(updatedGoals, tasks, blockers);
    setGoals(withStatus);
    saveState(withStatus, tasks);
  };

  const regenerateChecklist = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const goal = goals.find(g => g.id === task.goalId);
    let newSteps = [
      "Review baseline requirements and grading rubric",
      "Execute draft of first core module",
      "Polish design layout and test all boundary flows"
    ];
    
    try {
      const response = await fetch('/api/generate-subtask-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalName: goal?.name,
          goalDescription: goal?.description,
          taskTitle: task.title,
          subtaskText: "Create a fresh 3-step actionable study blueprint"
        })
      });
      const data = await response.json();
      if (data.draft) {
        const lines = data.draft.split('\n')
          .map((l: string) => l.replace(/^[-\*\d\.\s]+/, '').trim())
          .filter((l: string) => l.length > 0 && l.length < 100);
        if (lines.length >= 2) {
          newSteps = lines.slice(0, 3);
        }
      }
    } catch (err) {
      console.warn("AI checklist regeneration failed, falling back to local heuristic:", err);
    }
    
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklist: newSteps.map((stepText, idx) => ({
            id: `checklist-regen-${taskId}-${idx}-${Math.random()}`,
            text: stepText,
            completed: false
          }))
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    saveState(goals, updatedTasks);
  };

  return (
    <PlannerContext.Provider value={{
      goals,
      tasks,
      activeTab,
      setActiveTab,
      activeTaskId,
      pomodoro,
      activeRecovery,
      isGeneratingTasks,
      isGeneratingRecovery,
      isGeneratingDraft,
      apiWarning,
      gamification,
      completionHistory,
      toast,
      setToast,
      addGoal,
      deleteGoal,
      toggleTask,
      toggleChecklistItem,
      startFocus,
      pauseFocus,
      resetFocus,
      requestRecoveryPlan,
      applyRecoveryPlan,
      discardRecoveryPlan,
      generateSubtaskDraft,
      triggerAudioChime,
      blockers,
      logBlocker,
      deleteBlocker,
      moveTaskToTomorrow,
      splitMilestone,
      reduceWorkload,
      extendGoalDeadline,
      regenerateChecklist,
      calendarToken,
      isCalendarConnected,
      calendarEvents,
      isSandboxMode,
      connectCalendar,
      disconnectCalendar,
      setSandboxMode,
      fetchCalendarEvents
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};

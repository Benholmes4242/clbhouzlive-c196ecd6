/**
 * The Courses list chip row reports its stuck state upward through this
 * context so CoursesContent can suppress the Courses / Top 100 IslandDock:
 * one docked bar at a time (FIX_COURSES_LIST_STICKY_ROW). Optional — with no
 * provider StatBrowse behaves exactly as standalone.
 */
import { createContext } from 'react';

export const CoursesListStuckContext = createContext<((stuck: boolean) => void) | null>(null);

export interface DaySchedule {
  isWorkingDay: boolean;
  startTime: string;   // "09:00"
  endTime: string;     // "18:00"
  breakStart: string;  // "12:00"
  breakEnd: string;    // "13:00"
}

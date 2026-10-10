import { redirect } from "next/navigation";

/** Compatibility route: older links used timesheets (plural). */
export default function TeacherTimesheetsAlias() {
  redirect("/dashboard/teacher/timesheet");
}

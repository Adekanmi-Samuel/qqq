"use client";

import { useCallback } from "react";
import { useApi } from "./useApi";

export function useAttendance() {
  const { get, post, loading, error } = useApi();

  const getRecords = useCallback(async (classArmId: string, date?: string) => {
    let endpoint = `/api/attendance?classArmId=${classArmId}`;
    if (date) endpoint += `&date=${date}`;
    return get<{ success: boolean; data: any[] }>(endpoint);
  }, [get]);

  const mark = useCallback(async (records: Array<{
    studentId: string;
    classArmId: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    markedById: string;
    date?: string;
  }>) => {
    return post<{ success: boolean; data: { count: number } }>("/api/attendance", { records });
  }, [post]);

  const getReport = useCallback(async (classArmId: string, startDate?: string, endDate?: string) => {
    let endpoint = `/api/attendance/report?classArmId=${classArmId}`;
    if (startDate) endpoint += `&startDate=${startDate}`;
    if (endDate) endpoint += `&endDate=${endDate}`;
    return get<{ success: boolean; data: any }>(endpoint);
  }, [get]);

  return { getRecords, mark, getReport, loading, error };
}

"use client";

import { useCallback } from "react";
import { useApi } from "./useApi";

export function useStudents() {
  const { get, post, patch, del, loading, error } = useApi();

  const list = useCallback(async (schoolId: string, filters?: { classId?: string; armId?: string }) => {
    let endpoint = `/api/students?schoolId=${schoolId}`;
    if (filters?.classId) endpoint += `&classId=${filters.classId}`;
    if (filters?.armId) endpoint += `&armId=${filters.armId}`;
    return get<{ success: boolean; data: any[] }>(endpoint);
  }, [get]);

  const create = useCallback(async (data: any) => {
    return post<{ success: boolean; data: any; message: string }>("/api/students", data);
  }, [post]);

  const bulkImport = useCallback(async (schoolId: string, students: any[]) => {
    return post<{ success: boolean; data: { count: number }; message: string }>("/api/students/bulk", {
      schoolId,
      students,
    });
  }, [post]);

  const update = useCallback(async (id: string, data: any) => {
    return patch<{ success: boolean; data: any }>(`/api/students/${id}`, data);
  }, [patch]);

  const archive = useCallback(async (id: string) => {
    return del<{ success: boolean }>(`/api/students/${id}`);
  }, [del]);

  const promote = useCallback(async (studentIds: string[], newClassId: string, newArmId?: string) => {
    return post<{ success: boolean; message: string }>("/api/students/promote", {
      studentIds,
      newClassId,
      newArmId,
    });
  }, [post]);

  return { list, create, bulkImport, update, archive, promote, loading, error };
}

import { apiClient } from './client'
import type {
  Project,
  ProjectListParams,
  ProjectListResponse,
  ProjectUpsertRequest,
} from '../types/project'

export async function listProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
  const { data } = await apiClient.get<ProjectListResponse>('/projects', { params })
  return data
}

export async function getProject(projectId: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${projectId}`)
  return data
}

export async function createProject(payload: ProjectUpsertRequest): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects', payload)
  return data
}

export async function updateProject(
  projectId: string,
  payload: Partial<ProjectUpsertRequest>,
): Promise<Project> {
  const { data } = await apiClient.patch<Project>(`/projects/${projectId}`, payload)
  return data
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}`)
}

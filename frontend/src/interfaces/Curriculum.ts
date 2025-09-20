export interface Curriculum {
  id: number;
  curriculumName: string;
  year: number;
  started: number;
  majorId: number;
  majorName?: string;
  departmentId?: number;
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCurriculumInput {
  curriculumName: string;
  year: number;
  started: number;
  majorId: number;
}

export interface UpdateCurriculumInput {
  curriculumName?: string;
  year?: number;
  started?: number;
  majorId?: number;
}
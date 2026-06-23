export type ProgressStatus = 'Chưa thực hiện' | 'Đang xử lý' | 'Đã hoàn thành' | 'Trễ hạn';

export interface IncomingDocument {
  id: string;
  // Văn bản đến
  documentNumber: string;
  issueDate: string;
  issuingAgency: string;
  summary: string;
  directives: string;
  executingUnit: string;
  assignee: string; // Thêm trường người thụ lý
  specialistContent?: string; // Nội dung dành cho chuyên viên đơn vị

  // Trạng thái văn bản
  executionDate: string;
  deadline: string;
  progress: ProgressStatus;
  advisingDocNumber: string;
  leaderOpinion: string;
  archived: boolean; // Chuyển văn thư

  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

import React, { useState, useEffect } from 'react';
import { IncomingDocument, ProgressStatus } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: IncomingDocument) => Promise<void>;
  initialData?: IncomingDocument;
  viewMode?: 'van_phong' | 'don_vi';
}

const defaultFormData: Omit<IncomingDocument, 'id'> = {
  documentNumber: '',
  issueDate: '',
  issuingAgency: '',
  summary: '',
  directives: '',
  executingUnit: '',
  assignee: '',
  specialistContent: '',
  executionDate: '',
  deadline: '',
  progress: 'Chưa thực hiện',
  advisingDocNumber: '',
  leaderOpinion: '',
  archived: false,
};

export default function DocumentFormModal({ isOpen, onClose, onSave, initialData, viewMode }: Props) {
  const [formData, setFormData] = useState<Omit<IncomingDocument, 'id'>>(defaultFormData);

  const isVanPhong = viewMode === undefined || viewMode === 'van_phong';
  const isDonVi = viewMode === 'don_vi';

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        ...defaultFormData,
        issueDate: new Date().toISOString().split('T')[0] // default to today
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await onSave({
        id: initialData?.id || Date.now().toString(),
        ...formData
      } as IncomingDocument);
    } catch (err: any) {
      let msg = err?.message || "Đã xảy ra lỗi khi lưu.";
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.includes("Missing or insufficient permissions")) {
          msg = "Bạn không có quyền thực hiện tác vụ này (vi phạm quy định bảo mật).";
        } else if (parsed?.error) {
          msg = parsed.error;
        }
      } catch (e) {
        // Not a JSON string
      }
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative inline-flex flex-col w-full max-w-4xl px-4 pt-5 pb-4 text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle sm:p-6 max-h-[90vh]">
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
              <X size={24} />
            </button>
          </div>

          <div className="sm:flex sm:items-start mb-4 shrink-0">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-bold leading-6 text-gray-900 border-b pb-3">
                {initialData ? 'Cập nhật Văn bản đến' : 'Thêm mới Văn bản đến'}
              </h3>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative shrink-0" role="alert">
              <span className="block sm:inline">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Section 1: Thông tin văn bản */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Thông tin Văn bản</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số hiệu VB <span className="text-red-500">*</span></label>
                  <input required type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ban hành</label>
                  <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị ban hành</label>
                  <input type="text" name="issuingAgency" value={formData.issuingAgency} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trích yếu nội dung <span className="text-red-500">*</span></label>
                  <textarea required name="summary" rows={2} value={formData.summary} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
              </div>
            </div>

            {/* Section 2: Chỉ đạo & Phân công */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800 mb-4 uppercase tracking-wider">Chỉ đạo & Phân công</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">Nội dung chỉ đạo</label>
                  <textarea name="directives" rows={2} value={formData.directives} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300" placeholder="Yêu cầu xử lý..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Đơn vị thực hiện <span className="text-red-500">*</span></label>
                  <input required type="text" name="executingUnit" value={formData.executingUnit} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300" placeholder="VD: Phòng Hành chính" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Người thụ lý</label>
                  <input type="text" name="assignee" value={formData.assignee} onChange={handleChange} disabled={isVanPhong}
                    className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300" placeholder="VD: Nguyễn Văn A" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">Nội dung dành cho chuyên viên đơn vị</label>
                  <textarea name="specialistContent" rows={2} value={formData.specialistContent || ''} onChange={handleChange} disabled={isVanPhong}
                    className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300" placeholder="Nội dung chuyên viên xử lý..." />
                </div>
              </div>
            </div>

            {/* Section 3: Trạng thái & Kết quả */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Theo dõi Tiến độ</h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn tính</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lịch thực hiện / Ngày xong</label>
                  <input type="date" name="executionDate" value={formData.executionDate} onChange={handleChange} disabled={isVanPhong}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiến độ thực hiện</label>
                  <select name="progress" value={formData.progress} onChange={handleChange} disabled={isVanPhong}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500">
                    <option value="Chưa thực hiện">Chưa thực hiện</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Trễ hạn">Trễ hạn</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số văn bản tham mưu</label>
                  <input type="text" name="advisingDocNumber" value={formData.advisingDocNumber} onChange={handleChange} disabled={isVanPhong}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" placeholder="VD: 45/BC-VP" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ý kiến Lãnh đạo</label>
                  <input type="text" name="leaderOpinion" value={formData.leaderOpinion} onChange={handleChange} disabled={isDonVi}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" />
                </div>

                <div className="sm:col-span-3 flex items-center mt-2">
                  <input type="checkbox" id="archived" name="archived" checked={formData.archived} onChange={handleChange} disabled={isVanPhong}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50" />
                  <label htmlFor="archived" className="ml-2 block text-sm text-gray-900 font-medium whitespace-nowrap">
                    Đã chuyển Văn thư (Lưu trữ)
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
                Hủy bỏ
              </button>
              <button type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none">
                {initialData ? 'Cập nhật' : 'Thêm Văn bản'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

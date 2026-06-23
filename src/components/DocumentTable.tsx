import React from 'react';
import { IncomingDocument } from '../types';
import StatusBadge from './StatusBadge';
import { Edit2, Archive, CheckCircle2 } from 'lucide-react';

interface Props {
  documents: IncomingDocument[];
  onEdit: (doc: IncomingDocument) => void;
  viewMode: 'van_phong' | 'don_vi';
}

export default function DocumentTable({ documents, onEdit, viewMode }: Props) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">Không tìm thấy văn bản nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Số/Ngày VB</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Trích yếu & Chỉ đạo</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
              {viewMode === 'van_phong' ? 'Đơn vị thực hiện' : 'Người thụ lý'}
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 w-40">Thời hạn & Trạng thái</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Tham mưu / Kết quả</th>
            <th scope="col" className="relative px-4 py-3 w-16">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 align-top">
                <div className="font-medium text-blue-600">{doc.documentNumber}</div>
                <div className="text-gray-500 text-xs mt-1">{doc.issueDate}</div>
                <div className="text-gray-500 text-xs mt-1 line-clamp-1" title={doc.issuingAgency}>
                  {doc.issuingAgency}
                </div>
              </td>
              <td className="px-4 py-3 align-top min-w-[200px] max-w-[300px]">
                <div className="font-medium text-gray-900 mb-1">{doc.summary}</div>
                <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="font-semibold block mb-1">Chỉ đạo:</span>
                  {doc.directives || 'Không có'}
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                {viewMode === 'van_phong' ? (
                  <div>
                    <div className="font-medium text-gray-900">{doc.executingUnit || 'Chưa giao'}</div>
                    {doc.assignee && <div className="text-gray-500 text-xs mt-1">N/S: {doc.assignee}</div>}
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-gray-900">{doc.assignee || 'Chưa phân công'}</div>
                    <div className="text-gray-500 text-xs mt-1">{doc.executingUnit}</div>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="mb-2">
                  <StatusBadge status={doc.progress} />
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Hạn:</span>
                    <span className={`font-medium whitespace-nowrap ml-2 ${new Date(doc.deadline) < new Date() && doc.progress !== 'Đã hoàn thành' ? 'text-red-600' : ''}`}>
                      {doc.deadline || 'Không'}
                    </span>
                  </div>
                  {doc.executionDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Thực hiện:</span>
                      <span className="ml-2 whitespace-nowrap">{doc.executionDate}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 align-top min-w-[150px]">
                {doc.advisingDocNumber && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 block">Số tham mưu:</span>
                    <span className="font-medium text-gray-800">{doc.advisingDocNumber}</span>
                  </div>
                )}
                {doc.leaderOpinion && (
                  <div>
                     <span className="text-xs text-gray-500 block mb-1">Ý kiến Lãnh đạo:</span>
                     <p className="text-gray-700 text-xs italic bg-blue-50/50 p-1.5 rounded">{doc.leaderOpinion}</p>
                  </div>
                )}
                {doc.archived && (
                  <div className="mt-2 inline-flex items-center text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    <Archive size={12} className="mr-1" />
                    Đã chuyển VT
                  </div>
                )}
              </td>
              <td className="px-4 py-3 align-top text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(doc)}
                  className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                  title="Cập nhật văn bản"
                >
                  <Edit2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React, { useMemo } from 'react';
import { IncomingDocument } from '../types';
import { FileText, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  documents: IncomingDocument[];
}

export default function Dashboard({ documents }: Props) {
  const stats = useMemo(() => {
    const total = documents.length;
    const processing = documents.filter(d => d.progress === 'Đang xử lý' || d.progress === 'Chưa thực hiện').length;
    const completed = documents.filter(d => d.progress === 'Đã hoàn thành').length;
    const overdue = documents.filter(d => d.progress === 'Trễ hạn' || (new Date(d.deadline) < new Date() && d.progress !== 'Đã hoàn thành')).length;

    return { total, processing, completed, overdue };
  }, [documents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
        <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
          <FileText size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Tổng số văn bản</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
        <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 mr-4">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đang xử lý</p>
          <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
        <div className="p-3 rounded-full bg-red-50 text-red-600 mr-4">
          <AlertCircle size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Trễ hạn</p>
          <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
        <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Đã hoàn thành</p>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
      </div>
    </div>
  );
}

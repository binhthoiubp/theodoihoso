import React from 'react';
import { ProgressStatus } from '../types';

export default function StatusBadge({ status }: { status: ProgressStatus }) {
  let colorClass = '';
  switch (status) {
    case 'Chưa thực hiện':
      colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
      break;
    case 'Đang xử lý':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Đã hoàn thành':
      colorClass = 'bg-green-50 text-green-700 border-green-200';
      break;
    case 'Trễ hạn':
      colorClass = 'bg-red-50 text-red-700 border-red-200';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
}

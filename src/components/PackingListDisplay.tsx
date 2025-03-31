import React from 'react';
import { PackingList } from '../types';
import { CheckCircle, FolderOpen } from 'lucide-react';

interface PackingListDisplayProps {
  list: PackingList;
}

export const PackingListDisplay: React.FC<PackingListDisplayProps> = ({ list }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <FolderOpen className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Packing List</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {list.categories.map((category, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{category.name}</h3>
            <ul className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
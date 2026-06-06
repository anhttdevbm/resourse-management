import React, { useState, useEffect } from 'react';
import { StatisticsService, StatisticsData } from '../services/StatisticsService';

interface StatisticsWidgetProps {
  className?: string;
}

export const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({ className = '' }) => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        console.log('🔄 Loading statistics...');
        setLoading(true);
        setError(null);
        
        const data = await StatisticsService.getStatistics();
        console.log('📊 Statistics data:', data);
        
        setStatistics(data);
      } catch (err) {
        console.error('❌ Statistics Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className={`bg-blue-900 rounded-lg p-4 ${className}`}>
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
          <h3 className="text-yellow-400 font-semibold">Thống kê</h3>
        </div>
        <div className="text-cyan-300">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-blue-900 rounded-lg p-4 ${className}`}>
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
          <h3 className="text-yellow-400 font-semibold">Thống kê</h3>
        </div>
        <div className="text-red-400">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-900 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
        <h3 className="text-yellow-400 font-semibold">Thống kê</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-300">
            {statistics?.total_resources || 0}
          </div>
          <div className="text-sm text-blue-300">Tài nguyên</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-300">
            {statistics?.total_uploads || 0}
          </div>
          <div className="text-sm text-blue-300">Đã tải</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-300">
            {statistics?.total_users || 0}
          </div>
          <div className="text-xs text-blue-300">Người dùng</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-300">
            {statistics?.total_file_types || 0}
          </div>
          <div className="text-xs text-blue-300">Loại file</div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosSearch } from 'react-icons/io';
import { HiX } from 'react-icons/hi';
import { SearchService, SearchResource, SearchUser } from '../services/SearchService';
import { SearchHistoryService } from '../services/SearchHistoryService';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [resources, setResources] = useState<SearchResource[]>([]);
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResources([]);
            setUsers([]);
            setSelectedIndex(-1);
        }
    }, [isOpen]);

    useEffect(() => {
        const search = async () => {
            if (query.trim().length < 2) {
                setResources([]);
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const results = await SearchService.searchAll(query);
                setResources(results.resources);
                setUsers(results.users);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(search, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = resources.length + users.length;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleItemClick(selectedIndex);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const recordSearchToHistory = () => {
        const q = query.trim();
        if (q.length < 2) return;
        SearchHistoryService.addToHistory({
            query: q,
            resource_count: resources.length,
            user_count: users.length,
        });
    };

    const handleItemClick = (index: number) => {
        recordSearchToHistory();
        if (index < resources.length) {
            navigate(`/resources/${resources[index].id}`);
        } else {
            navigate(`/user/index`);
        }
        onClose();
    };

    const handleResourceClick = (resourceId: string) => {
        recordSearchToHistory();
        navigate(`/resources/${resourceId}`);
        onClose();
    };

    const handleUserClick = () => {
        recordSearchToHistory();
        navigate('/user/index');
        onClose();
    };

    if (!isOpen) return null;

    const totalItems = resources.length + users.length;
    const hasResults = resources.length > 0 || users.length > 0;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                        <IoIosSearch className="text-2xl text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm kiếm tài nguyên, người dùng..."
                            className="flex-1 outline-none text-lg"
                        />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <HiX className="text-xl text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                    {loading && (
                        <div className="p-8 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2">Đang tìm kiếm...</p>
                        </div>
                    )}

                    {!loading && query.trim().length < 2 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Nhập ít nhất 2 ký tự để tìm kiếm</p>
                        </div>
                    )}

                    {!loading && query.trim().length >= 2 && !hasResults && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Không tìm thấy kết quả nào</p>
                        </div>
                    )}

                    {!loading && hasResults && (
                        <div>
                            {/* Resources Section */}
                            {resources.length > 0 && (
                                <div className="border-b">
                                    <div className="px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                                        Tài nguyên ({resources.length})
                                    </div>
                                    {resources.map((resource, index) => (
                                        <div
                                            key={resource.id}
                                            onClick={() => handleResourceClick(resource.id)}
                                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                selectedIndex === index ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <IoIosSearch className="text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{resource.name}</div>
                                                    {resource.version && (
                                                        <div className="text-sm text-gray-500">Version: {resource.version}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Users Section */}
                            {users.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                                        Người dùng ({users.length})
                                    </div>
                                    {users.map((user, index) => (
                                        <div
                                            key={user.id}
                                            onClick={handleUserClick}
                                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                selectedIndex === resources.length + index ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-green-600 font-semibold">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                    {user.email && (
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    )}
                                                    {user.role && (
                                                        <div className="text-xs text-gray-400">{user.role}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {hasResults && (
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                        <div className="flex items-center justify-between">
                            <span>Nhấn Enter để chọn, Esc để đóng</span>
                            <span>{totalItems} kết quả</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchModal;


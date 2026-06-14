// src/components/dashboard/admin/UsersTable.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiShield,
  FiUserX,
  FiCheckCircle,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.data.users || []);
        setTotalUsers(response.data.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700"><FiShield size={12} /> Admin</span>;
    }
    return <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><FiUser size={12} /> Customer</span>;
  };

  const getStatusBadge = (isActive, isBlocked) => {
    if (isBlocked) {
      return <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><FiUserX size={12} /> Blocked</span>;
    }
    if (isActive) {
      return <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><FiCheckCircle size={12} /> Active</span>;
    }
    return <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Inactive</span>;
  };

  const handleToggleStatus = async (userId, currentStatus, isBlocked) => {
    if (updating) return;
    
    setUpdating(true);
    const action = isBlocked ? 'unblock' : 'block';
    
    try {
      const response = await api.post(`/admin/users/${userId}/${action}`);
      if (response.data.success) {
        toast.success(`User ${action === 'block' ? 'blocked' : 'unblocked'} successfully`);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold text-lg text-gray-800">Users Management</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Refresh Button */}
            <button
              onClick={fetchUsers}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw size={16} />
              <span>Refresh</span>
            </button>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Orders</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Joined</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {user.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.full_name}</p>
                        <p className="text-xs text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <FiMail size={12} />
                        <span className="truncate max-w-[150px]">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <FiPhone size={12} />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{user.orders_count || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <FiCalendar size={12} />
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(user.is_active, user.is_blocked)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status, user.is_blocked)}
                        disabled={user.role === 'admin' || updating}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.role === 'admin' 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : user.is_blocked
                              ? 'text-green-500 hover:bg-green-50'
                              : 'text-red-500 hover:bg-red-50'
                        }`}
                        title={user.role === 'admin' ? 'Cannot modify admin' : user.is_blocked ? 'Unblock User' : 'Block User'}
                      >
                        {user.is_blocked ? <FiCheckCircle size={16} /> : <FiUserX size={16} />}
                      </button>
                      <button 
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FiMoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 bg-primary-500 text-white rounded-lg">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
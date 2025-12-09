// Mock data for Admin Dashboard components
import type { SystemKPI, TrafficData, UserDistribution, AuditLog } from './admin.types';
import {
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  CloudQueue as CloudQueueIcon,
} from '@mui/icons-material';

export const mockKPIData: SystemKPI[] = [
  {
    id: 'total-users',
    label: 'Tổng số người dùng',
    value: '1,248',
    icon: <GroupIcon sx={{ fontSize: 28 }} />,
    trend: { value: 12.5, isPositive: true },
    status: 'safe',
    subtitle: 'so với tuần trước',
  },
  {
    id: 'system-uptime',
    label: 'Thời gian hoạt động',
    value: '99.9%',
    icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
    status: 'safe',
    subtitle: '30 ngày qua',
  },
  {
    id: 'error-rate',
    label: 'Lỗi hệ thống (24h)',
    value: 3,
    icon: <ErrorOutlineIcon sx={{ fontSize: 28 }} />,
    status: 'warning',
    subtitle: 'Cần kiểm tra',
  },
  {
    id: 'storage-usage',
    label: 'Lưu trữ dữ liệu',
    value: '45%',
    icon: <CloudQueueIcon sx={{ fontSize: 28 }} />,
    status: 'safe',
    progress: 45,
  },
];

export const mockTrafficData: TrafficData[] = [
  { date: '2024-12-01', requests: 2845, errors: 3 },
  { date: '2024-12-02', requests: 3120, errors: 5 },
  { date: '2024-12-03', requests: 2950, errors: 2 },
  { date: '2024-12-04', requests: 3580, errors: 8 },
  { date: '2024-12-05', requests: 3890, errors: 4 },
  { date: '2024-12-06', requests: 3450, errors: 6 },
  { date: '2024-12-07', requests: 3215, errors: 3 },
];

export const mockUserDistribution: UserDistribution[] = [
  { role: 'Admin', count: 5, color: '#d32f2f' },
  { role: 'HOD', count: 12, color: '#1976d2' },
  { role: 'Staff', count: 45, color: '#2e7d32' },
  { role: 'Sale', count: 30, color: '#ff9800' },
  { role: 'Customer', count: 56, color: '#9c27b0' }, // Purple - Màu tím
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    actor: { name: 'Nguyễn Văn A' },
    role: 'Admin',
    action: 'Cập nhật cấu hình hệ thống (Email SMTP)',
    ip: '192.168.1.105',
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    actor: { name: 'Trần Thị B' },
    role: 'Staff',
    action: 'Tạo hóa đơn mới #HD-2024-001',
    ip: '192.168.1.120',
    status: 'success',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actor: { name: 'Lê Văn C' },
    role: 'HOD',
    action: 'Phê duyệt mẫu email "Chào mừng khách hàng mới"',
    ip: '192.168.1.88',
    status: 'success',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    actor: { name: 'Phạm Thị D' },
    role: 'Staff',
    action: 'Xóa tài khoản người dùng "old-user@example.com"',
    ip: '192.168.1.132',
    status: 'failed',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    actor: { name: 'Hoàng Văn E' },
    role: 'Sale',
    action: 'Gửi báo giá cho khách hàng "ABC Corp"',
    ip: '192.168.1.95',
    status: 'success',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    actor: { name: 'Nguyễn Thị F' },
    role: 'Admin',
    action: 'Backup cơ sở dữ liệu hệ thống',
    ip: '192.168.1.105',
    status: 'success',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    actor: { name: 'Đỗ Văn G' },
    role: 'Staff',
    action: 'Chỉnh sửa thông tin khách hàng #KH-2024-105',
    ip: '192.168.1.142',
    status: 'success',
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    actor: { name: 'Vũ Thị H' },
    role: 'HOD',
    action: 'Tạo báo cáo doanh thu tháng 11/2024',
    ip: '192.168.1.88',
    status: 'success',
  },
  {
    id: '9',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    actor: { name: 'Bùi Văn I' },
    role: 'Admin',
    action: 'Cập nhật quyền truy cập cho vai trò "Staff"',
    ip: '192.168.1.105',
    status: 'failed',
  },
  {
    id: '10',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    actor: { name: 'Lý Thị K' },
    role: 'Sale',
    action: 'Xuất danh sách khách hàng tiềm năng',
    ip: '192.168.1.158',
    status: 'success',
  },
];

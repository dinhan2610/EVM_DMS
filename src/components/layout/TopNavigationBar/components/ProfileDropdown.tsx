import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Typography,
  ListItemText,
} from '@mui/material'
import {
  PersonOutline,
  Logout,
  MessageOutlined,
  AccountBalanceWalletOutlined,
  HelpOutline,
  LockOutlined,
  SettingsOutlined,
} from '@mui/icons-material'
import { useAuthContext } from '@/context/useAuthContext'

const ProfileDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  // Get initials from name
  const getInitials = (name: string) => {
    const nameParts = name.split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const userName = user?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleProfile = () => {
    navigate('/pages/profile')
    handleClose()
  }

  const handleMessages = () => {
    navigate('/apps/chat')
    handleClose()
  }

  const handlePricing = () => {
    navigate('/pages/pricing')
    handleClose()
  }

  const handleHelp = () => {
    navigate('/pages/faqs')
    handleClose()
  }

  const handleLockScreen = () => {
    navigate('/auth/lock-screen')
    handleClose()
  }

  const handleSettings = () => {
    navigate('/pages/profile')
    handleClose()
  }

  const handleLogout = async () => {
    handleClose()
    await logout()
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 1 }}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {getInitials(userName)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 240,
            overflow: 'visible',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1.5,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {userName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {userEmail}
          </Typography>
        </Box>

        <Divider />

        {/* Menu Items */}
        <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <PersonOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trang cá nhân</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMessages} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <MessageOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Tin nhắn</ListItemText>
        </MenuItem>

        <MenuItem onClick={handlePricing} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <AccountBalanceWalletOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bảng giá</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleHelp} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <HelpOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trợ giúp</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <SettingsOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cài đặt</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleLockScreen} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <LockOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Khóa màn hình</ListItemText>
        </MenuItem>

        <Divider />

        {/* Logout */}
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Đăng xuất</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export default ProfileDropdown

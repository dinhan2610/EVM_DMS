import { yupResolver } from '@hookform/resolvers/yup'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import { useAuthContext } from '@/context/useAuthContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import authService, { type LoginRequest } from '@/services/authService'
import type { UserType } from '@/types/auth'

const REMEMBER_ME_KEY = 'eims_remember_email'

const loginFormSchema = yup.object({
  email: yup.string().email('Vui lòng nhập email hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().required('Vui lòng nhập mật khẩu'),
  rememberMe: yup.boolean(),
})

type LoginFormFields = yup.InferType<typeof loginFormSchema>

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { saveSession } = useAuthContext()
  const [searchParams] = useSearchParams()
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit, setValue } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Load saved email on mount (only email, NOT password for security)
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY)
    if (savedEmail) {
      try {
        setValue('email', savedEmail)
        setValue('rememberMe', true)
      } catch (error) {
        console.error('Failed to load saved email:', error)
        localStorage.removeItem(REMEMBER_ME_KEY)
      }
    }
  }, [setValue])

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    try {
      // Handle Remember Me - ONLY save email, never password
      if (values.rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, values.email)
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY)
      }

      const response = await authService.login(values as LoginRequest)

      const user: UserType = {
        id: String(response.userID),
        email: response.email,
        username: response.email.split('@')[0],
        name: response.fullName,
        firstName: response.fullName.split(' ')[0] || '',
        lastName: response.fullName.split(' ').slice(1).join(' ') || '',
        role: response.role,
        token: response.accessToken,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        password: '',
      }

      saveSession(user)

      const redirectLink = searchParams.get('redirectTo')
      navigate(redirectLink || '/')

      showNotification({
        message: 'Đăng nhập thành công!',
        variant: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra'
      showNotification({
        message,
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  })

  return { loading, login, control }
}

export default useSignIn

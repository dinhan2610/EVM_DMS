import { yupResolver } from '@hookform/resolvers/yup'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import { useAuthContext } from '@/context/useAuthContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import authService, { type LoginRequest } from '@/services/authService'
import type { UserType } from '@/types/auth'

const REMEMBER_ME_KEY = 'eims_remember_me'

const loginFormSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password'),
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
      email: 'admin@eims.local',
      password: 'P3ssword!',
      rememberMe: false,
    },
  })

  // Load saved credentials on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem(REMEMBER_ME_KEY)
    if (savedCredentials) {
      try {
        const { email, password } = JSON.parse(savedCredentials)
        setValue('email', email)
        setValue('password', password)
        setValue('rememberMe', true)
      } catch (error) {
        console.error('Failed to load saved credentials:', error)
        localStorage.removeItem(REMEMBER_ME_KEY)
      }
    }
  }, [setValue])

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    try {
      // Handle Remember Me
      if (values.rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email: values.email,
          password: values.password,
        }))
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
        variant: 'success' 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra'
      showNotification({ 
        message, 
        variant: 'danger' 
      })
    } finally {
      setLoading(false)
    }
  })

  return { loading, login, control }
}

export default useSignIn

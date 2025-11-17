import { yupResolver } from '@hookform/resolvers/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as yup from 'yup'
import { useAuthContext } from '@/context/useAuthContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import authService, { type LoginRequest } from '@/services/authService'
import type { UserType } from '@/types/auth'

const loginFormSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password'),
})

type LoginFormFields = yup.InferType<typeof loginFormSchema>

const useSignIn = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { saveSession } = useAuthContext()
  const [searchParams] = useSearchParams()
  const { showNotification } = useNotificationContext()

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: 'admin@eims.local',
      password: 'P3ssword!',
    },
  })

  const login = handleSubmit(async (values: LoginFormFields) => {
    setLoading(true)
    try {
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

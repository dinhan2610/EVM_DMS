import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import ChangePassword from '../components/ChangePassword'

const PasswordPage = () => {
  return (
    <>
      <PageBreadcrumb subName="Khách hàng" title="Đổi mật khẩu" />
      <PageMetaData title="Đổi mật khẩu" />
      <ChangePassword />
    </>
  )
}

export default PasswordPage

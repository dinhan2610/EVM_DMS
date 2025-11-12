import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import CustomerProfile from '../components/CustomerProfile'

const ProfilePage = () => {
  return (
    <>
      <PageBreadcrumb subName="Khách hàng" title="Thông tin cá nhân" />
      <PageMetaData title="Thông tin cá nhân" />
      <CustomerProfile />
    </>
  )
}

export default ProfilePage

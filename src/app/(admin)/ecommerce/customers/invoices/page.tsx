import { Container } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import CustomersListView from '@/app/(admin)/ecommerce/customers/components/CustomersListView'

const CustomerInvoices = () => {
  return (
    <>
      <PageTitle title="Hóa đơn của tôi" />
      <Container fluid>
        <CustomersListView />
      </Container>
    </>
  )
}

export default CustomerInvoices

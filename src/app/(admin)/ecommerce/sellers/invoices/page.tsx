import { Container } from 'react-bootstrap'
import PageTitle from '@/components/PageTitle'
import SellerInvoicesList from '../components/SellersInvoiceListView'

const SellerInvoicesPage = () => {
  return (
    <>
      <PageTitle title="Hóa đơn của tôi" />
      <Container fluid>
        <SellerInvoicesList />
      </Container>
    </>
  )
}

export default SellerInvoicesPage

import { TabContainer, TabContent, TabPane } from 'react-bootstrap'
import CustomersListView from './CustomersListView'
import type { CustomerType } from '@/types/data'
import CustomersGrid from './CustomersGrid'

const CustomersList = ({ customers }: { customers: CustomerType[] }) => {
  return (
    <TabContainer defaultActiveKey={'1'}>
      <TabContent className="pt-0">
        <TabPane eventKey={'1'} id="team-list">
          <CustomersListView />
        </TabPane>
        <TabPane eventKey={'0'} id="team-grid">
          <CustomersGrid customers={customers} />
        </TabPane>
      </TabContent>
    </TabContainer>
  )
}

export default CustomersList

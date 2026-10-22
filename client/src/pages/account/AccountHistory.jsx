import { Helmet } from 'react-helmet-async';
import ManagedList from '../admin/ManagedList';
import { searchService } from '../../services/searchService';
import { mySearchColumns } from './accountColumns';

export default function AccountHistory() {
  return (
    <>
      <Helmet><title>My searches · OUR</title></Helmet>
      <ManagedList title="My searches" loader={searchService.mine} columns={mySearchColumns} emptyTitle="No searches yet" emptyText="Searches you make while signed in will appear here." />
    </>
  );
}

import ManagedList from './ManagedList';
import { adminApi } from '../../services/adminApi';
import { searchColumns } from './columns';

export default function AdminSearches() {
  return <ManagedList title="Ride searches" loader={adminApi.searches} columns={searchColumns} emptyTitle="No searches yet" emptyText="Searches submitted from the home page or Search Rides will appear here. Records are removed automatically after 180 days." />;
}

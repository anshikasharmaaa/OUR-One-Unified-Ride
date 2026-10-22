import PlaceholderPage from '../common/PlaceholderPage';
export default function UserHome() {
  return (
    <PlaceholderPage tag="Home" heading={(u) => `Welcome, ${u.name.split(' ')[0]}`}>
      Your account is verified and you are signed in. Ride comparison arrives in the next phase.
    </PlaceholderPage>
  );
}

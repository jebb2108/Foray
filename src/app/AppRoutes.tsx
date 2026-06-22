import { useState } from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import {
  loadLocalUser,
  LocalUserProfile,
  removeLocalUser,
} from '../data/localUser';
import SignUp from '../pages/SignUp';
import MainTabs from './MainTabs';

export function AppRoutes() {
  const [user, setUser] = useState<LocalUserProfile | null>(() => loadLocalUser());

  if (!user) {
    return (
      <IonRouterOutlet>
        <Route path="/">
          <SignUp onComplete={setUser} />
        </Route>
        <Redirect to="/" />
      </IonRouterOutlet>
    );
  }

  const resetProfile = () => {
    removeLocalUser();
    setUser(null);
  };

  return (
    <MainTabs user={user} onResetProfile={resetProfile} />
  );
}

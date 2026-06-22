import { useState } from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import {
  loadLocalUser,
  LocalUserProfile,
  removeLocalUser,
} from '../data/localUser';
import Discover from '../pages/Discover';
import Events from '../pages/Events';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import SignUp from '../pages/SignUp';

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
    <IonRouterOutlet>
      <Route exact path="/">
        <Home user={user} onResetProfile={resetProfile} />
      </Route>
      <Route exact path="/discover" component={Discover} />
      <Route exact path="/events" component={Events} />
      <Route exact path="/profile" component={Profile} />
      <Route exact path="/settings" component={Settings} />
      <Redirect to="/" />
    </IonRouterOutlet>
  );
}

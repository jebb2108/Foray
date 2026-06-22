import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  chatbubblesOutline,
  peopleOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { Redirect, Route } from 'react-router-dom';
import { LocalUserProfile } from '../data/localUser';
import Chats from '../pages/Chats';
import Profile from '../pages/Profile';
import WaitingRoom from '../pages/WaitingRoom';
import './MainTabs.scss';

interface MainTabsProps {
  user: LocalUserProfile;
  onResetProfile: () => void;
}

export default function MainTabs({ user, onResetProfile }: MainTabsProps) {
  return (
    <IonTabs className="main-tabs">
      <IonRouterOutlet>
        <Route exact path="/waiting">
          <WaitingRoom user={user} />
        </Route>
        <Route exact path="/chats">
          <Chats user={user} />
        </Route>
        <Route exact path="/profile">
          <Profile user={user} onResetProfile={onResetProfile} />
        </Route>
        <Redirect exact from="/" to="/chats" />
        <Redirect to="/chats" />
      </IonRouterOutlet>

      <IonTabBar className="main-tab-bar" slot="bottom">
        <IonTabButton tab="waiting" href="/waiting">
          <IonIcon icon={peopleOutline} />
          <IonLabel>Ожидание</IonLabel>
        </IonTabButton>
        <IonTabButton tab="chats" href="/chats">
          <IonIcon icon={chatbubblesOutline} />
          <IonLabel>Чаты</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personCircleOutline} />
          <IonLabel>Профиль</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

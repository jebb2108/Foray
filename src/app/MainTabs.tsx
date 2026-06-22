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
} from '../shared/icons';
import { Redirect, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMessagingStore } from '../features/messaging/hooks/useMessagingStore';
import ChatConversation from '../features/messaging/pages/ChatConversation';
import Chats from '../features/messaging/pages/Chats';
import { UserProfile, UserProfileChanges } from '../features/profile/model/userProfile';
import Profile from '../features/profile/pages/Profile';
import WaitingRoom from '../features/waiting-room/pages/WaitingRoom';
import './styles/MainTabs.scss';

interface MainTabsProps {
  user: UserProfile;
  onResetProfile: () => void;
  onUpdateProfile: (changes: UserProfileChanges) => void;
}

export default function MainTabs({
  user,
  onResetProfile,
  onUpdateProfile,
}: MainTabsProps) {
  const location = useLocation();
  const messaging = useMessagingStore(user.id);
  const { chats, messages } = messaging.state;

  const isConversationOpen = location.pathname.startsWith('/chats/');

  return (
    <IonTabs className="main-tabs">
      <IonRouterOutlet animated={false}>
        <Route exact path="/waiting">
          <WaitingRoom user={user} />
        </Route>
        <Route exact path="/chats">
          <Chats
            user={user}
            chats={chats}
            messages={messages}
            onCreateChat={messaging.createChat}
          />
        </Route>
        <Route exact path="/chats/:chatId">
          <ChatConversation
            chats={chats}
            messages={messages}
            onOpenChat={messaging.openChat}
            onSendMessage={messaging.sendMessage}
            onEditMessage={messaging.editMessage}
            onDeleteMessage={messaging.deleteMessage}
            onReactToMessage={messaging.reactToMessage}
            onSaveMessage={messaging.saveMessage}
            onClearChat={messaging.clearChat}
            onDeleteChat={messaging.deleteChat}
          />
        </Route>
        <Route exact path="/profile">
          <Profile
            user={user}
            onResetProfile={onResetProfile}
            onUpdateProfile={onUpdateProfile}
          />
        </Route>
        <Redirect exact from="/" to="/chats" />
        <Redirect to="/chats" />
      </IonRouterOutlet>

      <IonTabBar
        className={`main-tab-bar${isConversationOpen ? ' main-tab-bar--hidden' : ''}`}
        slot="bottom"
      >
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

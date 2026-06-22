import { useEffect, useState } from 'react';
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
import { useLocation } from 'react-router-dom';
import {
  createLocalChat,
  createLocalId,
  loadLocalChats,
  LocalChat,
  LocalMessage,
  saveLocalChats,
} from '../data/localChats';
import { LocalUserProfile, NewLocalUserProfile } from '../data/localUser';
import ChatConversation from '../pages/ChatConversation';
import Chats from '../pages/Chats';
import Profile from '../pages/Profile';
import WaitingRoom from '../pages/WaitingRoom';
import './MainTabs.scss';

interface MainTabsProps {
  user: LocalUserProfile;
  onResetProfile: () => void;
  onUpdateProfile: (changes: Partial<NewLocalUserProfile>) => void;
}

export default function MainTabs({
  user,
  onResetProfile,
  onUpdateProfile,
}: MainTabsProps) {
  const location = useLocation();
  const [chats, setChats] = useState<LocalChat[]>(() => loadLocalChats());

  useEffect(() => {
    saveLocalChats(chats);
  }, [chats]);

  const openChat = (chatId: string) => {
    setChats((current) => {
      const target = current.find((chat) => chat.id === chatId);
      if (!target || target.unread === 0) {
        return current;
      }

      return current.map((chat) => chat.id === chatId ? { ...chat, unread: 0 } : chat);
    });
  };

  const sendMessage = (
    chatId: string,
    text: string,
    replyTo?: LocalMessage['replyTo'],
    messageId?: string,
  ) => {
    const targetChat = chats.find((chat) => chat.id === chatId);
    const newMessage: LocalMessage = {
      id: messageId ?? createLocalId(),
      text: text.trim(),
      sender: 'me',
      createdAt: new Date().toISOString(),
      status: targetChat?.isSaved ? 'read' : 'sent',
      replyTo,
    };

    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              unread: 0,
              messages: [...(Array.isArray(chat.messages) ? chat.messages : []), newMessage],
            }
          : chat,
      ),
    );

    if (!targetChat?.isSaved) {
      window.setTimeout(() => {
        setChats((current) =>
          current.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((message) =>
                    message.id === newMessage.id
                      ? { ...message, status: 'read' }
                      : message,
                  ),
                }
              : chat,
          ),
        );
      }, 1_200);
    }
  };

  const editMessage = (chatId: string, messageId: string, text: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, text: text.trim() } : message,
              ),
            }
          : chat,
      ),
    );
  };

  const deleteMessage = (chatId: string, messageId: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.filter((message) => message.id !== messageId),
            }
          : chat,
      ),
    );
  };

  const reactToMessage = (chatId: string, messageId: string, reaction: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      reaction: message.reaction === reaction ? undefined : reaction,
                    }
                  : message,
              ),
            }
          : chat,
      ),
    );
  };

  const saveMessage = (text: string) => {
    const savedMessage: LocalMessage = {
      id: createLocalId(),
      text,
      sender: 'me',
      createdAt: new Date().toISOString(),
      status: 'read',
    };

    setChats((current) =>
      current.map((chat) =>
        chat.id === 'saved'
          ? { ...chat, messages: [...chat.messages, savedMessage] }
          : chat,
      ),
    );
  };

  const createChat = (name: string, color: string): LocalChat => {
    const chat = createLocalChat(name, color);
    setChats((current) => [...current, chat]);
    return chat;
  };

  const clearChat = (chatId: string) => {
    setChats((current) =>
      current.map((chat) => chat.id === chatId ? { ...chat, messages: [] } : chat),
    );
  };

  const deleteChat = (chatId: string) => {
    setChats((current) => current.filter((chat) => chat.id !== chatId));
  };

  const isConversationOpen = location.pathname.startsWith('/chats/');

  return (
    <IonTabs className="main-tabs">
      <IonRouterOutlet animated={false}>
        <Route exact path="/waiting">
          <WaitingRoom user={user} />
        </Route>
        <Route exact path="/chats">
          <Chats user={user} chats={chats} onCreateChat={createChat} />
        </Route>
        <Route exact path="/chats/:chatId">
          <ChatConversation
            chats={chats}
            onOpenChat={openChat}
            onSendMessage={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onReactToMessage={reactToMessage}
            onSaveMessage={saveMessage}
            onClearChat={clearChat}
            onDeleteChat={deleteChat}
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

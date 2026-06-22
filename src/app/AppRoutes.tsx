import { useState } from 'react';
import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import {
  loadUserProfile,
  removeUserProfile,
  updateUserProfile,
} from '../features/profile/repository/userProfileRepository';
import { UserProfile } from '../features/profile/model/userProfile';
import SignUp from '../features/onboarding/pages/SignUp';
import MainTabs from './MainTabs';

export function AppRoutes() {
  const [user, setUser] = useState<UserProfile | null>(() => loadUserProfile());

  // Отсутствие локального профиля возвращает пользователя к регистрации
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
    removeUserProfile();
    setUser(null);
  };

  const updateProfile = (changes: Parameters<typeof updateUserProfile>[1]) => {
    setUser((current) => current ? updateUserProfile(current, changes) : current);
  };

  return (
    <MainTabs
      user={user}
      onResetProfile={resetProfile}
      onUpdateProfile={updateProfile}
    />
  );
}

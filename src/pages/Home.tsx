import React from 'react';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import { LocalUserProfile } from '../data/localUser';

interface HomeProps {
  user: LocalUserProfile;
  onResetProfile: () => void;
}

const Home: React.FC<HomeProps> = ({ user, onResetProfile }) => {
    return (
        <IonPage>
            <IonContent className="ion-padding">
                <h1>Привет, {user.name}!</h1>
                <p>@{user.username}</p>
                <p>Профиль сохранён локально на этом устройстве.</p>
                <IonButton fill="outline" color="medium" onClick={onResetProfile}>
                  Удалить локальный профиль
                </IonButton>
            </IonContent>
        </IonPage>
    );
};

export default Home;

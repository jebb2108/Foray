import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const Profile: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>User Profile</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <h1>User Profile</h1>
                {/* User profile details here */}
            </IonContent>
        </IonPage>
    );
};

export default Profile;
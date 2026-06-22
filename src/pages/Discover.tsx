import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const Discover: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Discover</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <h1>Discover New Interests</h1>
                {/* Content to help users discover new interests */}
            </IonContent>
        </IonPage>
    );
};

export default Discover;
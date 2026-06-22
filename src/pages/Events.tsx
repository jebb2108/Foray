import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const Events: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Events</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <h1>Upcoming Events</h1>
                {/* List of upcoming events */}
            </IonContent>
        </IonPage>
    );
};

export default Events;
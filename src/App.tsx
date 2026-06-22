import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AppRoutes } from './app/AppRoutes';

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </IonApp>
  );
}

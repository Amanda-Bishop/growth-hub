import 'react-native-gesture-handler';
import React from 'react';

import {DataProvider} from './src/hooks';
import AppNavigation from './src/navigation/App';
import { Provider as PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <DataProvider>
      <PaperProvider>
        <AppNavigation />
      </PaperProvider>
    </DataProvider>
  );
}

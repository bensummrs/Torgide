import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { MapScreen } from './screens/MapScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <GluestackUIProvider config={config}>
        <MapScreen />
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

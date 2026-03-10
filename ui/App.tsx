import { GluestackUIProvider, Box, Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <Box style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
            title="San Francisco"
            description="Hello from react-native-maps!"
          />
        </MapView>

        <Box style={styles.overlay}>
          <VStack space="md" p="$4" bg="$white" borderRadius="$xl">
            <Heading size="md">Pebl</Heading>
            <Text size="sm" color="$textLight600">San Francisco, CA</Text>
            <Button onPress={() => {}}>
              <ButtonText>Explore Area</ButtonText>
            </Button>
          </VStack>
        </Box>

        <StatusBar style="auto" />
      </Box>
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
});

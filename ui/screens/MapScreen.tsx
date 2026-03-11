import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Colors } from '../theme';
import { Pin, PinType } from '../types';
import { AddPinSheet } from '../components/AddPinSheet';

const API_URL = 'http://10.2.0.58:8000';

const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export function MapScreen() {
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<PinType>('view_spot');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setUserLocation({ latitude, longitude });
      setRegion({ latitude, longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
    })();
    loadPins();
  }, []);

  async function loadPins() {
    try {
      const res = await fetch(`${API_URL}/pins`);
      const data: Pin[] = await res.json();
      setPins(data);
    } catch (e) {
      // API not reachable — silently ignore
    }
  }

  async function savePin() {
    if (!formName.trim() || !pendingCoord) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          type: formType,
          notes: formNotes.trim() || undefined,
          latitude: pendingCoord.latitude,
          longitude: pendingCoord.longitude,
        }),
      });
      await loadPins();
      closeSheet();
    } finally {
      setSaving(false);
    }
  }

  function openSheet() {
    setFormName('');
    setFormType('view_spot');
    setFormNotes('');
    setPendingCoord(null);
    setSheetVisible(true);
  }

  function closeSheet() {
    setSheetVisible(false);
    setPickingLocation(false);
    setPendingCoord(null);
  }

  function startPickingLocation() {
    setSheetVisible(false);
    setPickingLocation(true);
  }

  function handleMapPress(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    if (!pickingLocation) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPendingCoord({ latitude, longitude });
    setPickingLocation(false);
    setSheetVisible(true);
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {userLocation && <Marker coordinate={userLocation} title="You are here" />}
        {pins.map(pin => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.name}
            description={pin.type === 'view_spot' ? 'View Spot' : 'Cool Spot'}
            pinColor={pin.type === 'view_spot' ? Colors.primary : Colors.primaryDark}
          />
        ))}
        {pendingCoord && (
          <Marker coordinate={pendingCoord} pinColor={Colors.primary} title="New Pin" />
        )}
      </MapView>

      {!pickingLocation && !sheetVisible && (
        <TouchableOpacity style={styles.fab} onPress={openSheet}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}

      {pickingLocation && (
        <View style={styles.pickBanner} pointerEvents="none">
          <Text style={styles.pickBannerText}>Tap on the map to set location</Text>
        </View>
      )}

      {!pickingLocation && (
        <AddPinSheet
          visible={sheetVisible}
          onClose={closeSheet}
          formName={formName}
          setFormName={setFormName}
          formType={formType}
          setFormType={setFormType}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          pendingCoord={pendingCoord}
          onPickLocation={startPickingLocation}
          onSave={savePin}
          saving={saving}
        />
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  map: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pickBanner: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  pickBannerText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});

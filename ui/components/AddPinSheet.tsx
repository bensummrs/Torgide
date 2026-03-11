import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useRef, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, TextInput,
} from 'react-native';
import { Colors, Typography } from '../theme';
import { PinType, PIN_TYPE_LABELS } from '../types';

interface AddPinSheetProps {
  visible: boolean;
  onClose: () => void;
  formName: string;
  setFormName: (v: string) => void;
  formType: PinType;
  setFormType: (v: PinType) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  pendingCoord: { latitude: number; longitude: number } | null;
  onPickLocation: () => void;
  onSave: () => void;
  saving: boolean;
}

export function AddPinSheet({
  visible, onClose,
  formName, setFormName,
  formType, setFormType,
  formNotes, setFormNotes,
  pendingCoord, onPickLocation,
  onSave, saving,
}: AddPinSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%', '90%', '100%'], []);
  const canSave = formName.trim().length > 0 && pendingCoord !== null;
  // Capture the initial value so the BottomSheet opens at the correct snap point
  // on mount rather than relying solely on an effect (which fires after the first paint).
  const initialIndex = useRef(visible ? 1 : -1).current;

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(1);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={initialIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[Typography.titleSM, styles.title]}>Add Pin</Text>

        <Text style={[Typography.label, styles.fieldLabel]}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sunset Lookout"
          placeholderTextColor={Colors.grey400}
          value={formName}
          onChangeText={setFormName}
        />

        <Text style={[Typography.label, styles.fieldLabel]}>Type</Text>
        <View style={styles.typeRow}>
          {(['view_spot', 'cool_spot'] as PinType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeButton, formType === t && styles.typeButtonActive]}
              onPress={() => setFormType(t)}
            >
              <Text style={[Typography.label, formType === t ? styles.typeButtonTextActive : styles.typeButtonText]}>
                {PIN_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[Typography.label, styles.fieldLabel]}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Any details..."
          placeholderTextColor={Colors.grey400}
          value={formNotes}
          onChangeText={setFormNotes}
          multiline
          numberOfLines={3}
        />

        <Text style={[Typography.label, styles.fieldLabel]}>Location</Text>
        <TouchableOpacity style={styles.locationButton} onPress={onPickLocation}>
          <Text style={[Typography.bodyMD, { color: pendingCoord ? Colors.primary : Colors.grey600 }]}>
            {pendingCoord
              ? `${pendingCoord.latitude.toFixed(5)}, ${pendingCoord.longitude.toFixed(5)}`
              : 'Tap to pick on map →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !canSave && styles.buttonDisabled, { marginTop: 20, marginBottom: 40 }]}
          onPress={onSave}
          disabled={!canSave || saving}
        >
          <Text style={[Typography.label, styles.buttonText]}>
            {saving ? 'Saving…' : 'Save Pin'}
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: Colors.grey400,
    width: 36,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    color: Colors.black,
    marginBottom: 20,
  },
  fieldLabel: {
    color: Colors.grey800,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.black,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 11,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF0F5',
  },
  typeButtonText: {
    color: Colors.grey600,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  locationButton: {
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.grey200,
  },
  buttonText: {
    color: Colors.white,
  },
});

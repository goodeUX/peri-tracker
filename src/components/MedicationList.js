import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  Surface,
  Checkbox,
  IconButton,
  Button,
  Dialog,
  Portal,
  TextInput,
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { getColors, spacing, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { MEDICATION_FREQUENCIES } from '../utils/constants';

export default function MedicationList({
  medications,
  medicationLogs,
  onMedicationLogChange,
  onAddMedication,
  onEditMedication,
  onDeleteMedication,
  editable = true,
}) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);

  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFrequency, setNewMedFrequency] = useState('daily');
  const [frequencyMenuVisible, setFrequencyMenuVisible] = useState(false);

  const isTaken = (medicationId) => {
    const log = medicationLogs.find((l) => l.medicationId === medicationId);
    return log ? log.taken : false;
  };

  const toggleTaken = (medicationId) => {
    const existing = medicationLogs.find((l) => l.medicationId === medicationId);
    if (existing) {
      onMedicationLogChange(
        medicationLogs.map((l) =>
          l.medicationId === medicationId ? { ...l, taken: !l.taken } : l
        )
      );
    } else {
      onMedicationLogChange([
        ...medicationLogs,
        { medicationId, taken: true, notes: null },
      ]);
    }
  };

  const handleAddMedication = () => {
    if (newMedName.trim()) {
      onAddMedication(newMedName.trim(), newMedDose.trim(), newMedFrequency);
      resetForm();
      setAddDialogVisible(false);
    }
  };

  const handleEditMedication = () => {
    if (editingMedication && newMedName.trim()) {
      onEditMedication(
        editingMedication.id,
        newMedName.trim(),
        newMedDose.trim(),
        newMedFrequency,
        true
      );
      resetForm();
      setEditDialogVisible(false);
    }
  };

  const openEditDialog = (medication) => {
    setEditingMedication(medication);
    setNewMedName(medication.name);
    setNewMedDose(medication.dose || '');
    setNewMedFrequency(medication.frequency || 'daily');
    setEditDialogVisible(true);
  };

  const resetForm = () => {
    setNewMedName('');
    setNewMedDose('');
    setNewMedFrequency('daily');
    setEditingMedication(null);
  };

  const getFrequencyLabel = (value) => {
    const freq = MEDICATION_FREQUENCIES.find((f) => f.value === value);
    return freq ? freq.label : value;
  };

  const renderMedicationItem = ({ item }) => (
    <Surface style={styles.medicationCard} elevation={1}>
      <View style={styles.medicationInfo}>
        <Checkbox
          status={isTaken(item.id) ? 'checked' : 'unchecked'}
          onPress={() => toggleTaken(item.id)}
          color={colors.primary}
        />
        <View style={styles.medicationDetails}>
          <Text style={styles.medicationName}>{item.name}</Text>
          {item.dose && (
            <Text style={styles.medicationDose}>{item.dose}</Text>
          )}
          <Text style={styles.medicationFrequency}>
            {getFrequencyLabel(item.frequency)}
          </Text>
        </View>
      </View>

      {editable && (
        <View style={styles.medicationActions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => openEditDialog(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor={colors.error}
            onPress={() => onDeleteMedication(item.id)}
          />
        </View>
      )}
    </Surface>
  );

  return (
    <View style={styles.container}>
      {medications.length === 0 ? (
        <Surface style={styles.emptyState} elevation={1}>
          <Icon name="pill" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No medications added yet</Text>
          <Text style={styles.emptySubtext}>
            Add your medications to track daily intake
          </Text>
        </Surface>
      ) : (
        <FlatList
          data={medications}
          renderItem={renderMedicationItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      )}

      {editable && (
        <Button
          mode="outlined"
          onPress={() => setAddDialogVisible(true)}
          icon="plus"
          style={styles.addButton}
        >
          Add Medication
        </Button>
      )}

      <Portal>
        {/* Add Medication Dialog */}
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => {
            resetForm();
            setAddDialogVisible(false);
          }}
        >
          <Dialog.Title>Add Medication</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Medication Name"
              value={newMedName}
              onChangeText={setNewMedName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Dose (optional)"
              value={newMedDose}
              onChangeText={setNewMedDose}
              mode="outlined"
              placeholder="e.g., 100mg"
              style={styles.input}
            />
            <Menu
              visible={frequencyMenuVisible}
              onDismiss={() => setFrequencyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setFrequencyMenuVisible(true)}
                  style={styles.frequencyButton}
                >
                  Frequency: {getFrequencyLabel(newMedFrequency)}
                </Button>
              }
            >
              {MEDICATION_FREQUENCIES.map((freq) => (
                <Menu.Item
                  key={freq.value}
                  onPress={() => {
                    setNewMedFrequency(freq.value);
                    setFrequencyMenuVisible(false);
                  }}
                  title={freq.label}
                />
              ))}
            </Menu>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                resetForm();
                setAddDialogVisible(false);
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleAddMedication} disabled={!newMedName.trim()}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Medication Dialog */}
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => {
            resetForm();
            setEditDialogVisible(false);
          }}
        >
          <Dialog.Title>Edit Medication</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Medication Name"
              value={newMedName}
              onChangeText={setNewMedName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Dose (optional)"
              value={newMedDose}
              onChangeText={setNewMedDose}
              mode="outlined"
              placeholder="e.g., 100mg"
              style={styles.input}
            />
            <Menu
              visible={frequencyMenuVisible}
              onDismiss={() => setFrequencyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setFrequencyMenuVisible(true)}
                  style={styles.frequencyButton}
                >
                  Frequency: {getFrequencyLabel(newMedFrequency)}
                </Button>
              }
            >
              {MEDICATION_FREQUENCIES.map((freq) => (
                <Menu.Item
                  key={freq.value}
                  onPress={() => {
                    setNewMedFrequency(freq.value);
                    setFrequencyMenuVisible(false);
                  }}
                  title={freq.label}
                />
              ))}
            </Menu>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                resetForm();
                setEditDialogVisible(false);
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleEditMedication} disabled={!newMedName.trim()}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicationDetails: {
    marginLeft: spacing.sm,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  medicationDose: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  medicationFrequency: {
    fontSize: 12,
    color: colors.textLight,
  },
  medicationActions: {
    flexDirection: 'row',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  frequencyButton: {
    marginTop: spacing.sm,
  },
});

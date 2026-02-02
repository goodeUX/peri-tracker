import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import {
  Text,
  Surface,
  Switch,
  Button,
  TextInput,
  Portal,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { getColors, spacing, borderRadius } from '../theme';
import { clearAllData } from '../database/database';

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = getColors(isDarkMode);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteData = async () => {
    if (!confirmName.trim()) {
      setDeleteError('Please enter your first name to confirm');
      return;
    }

    if (confirmName.trim().length < 2) {
      setDeleteError('Please enter a valid name');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await clearAllData();
      setDeleteModalVisible(false);
      setConfirmName('');
    } catch (error) {
      console.error('Error deleting data:', error);
      setDeleteError('Failed to delete data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setDeleteModalVisible(false);
    setConfirmName('');
    setDeleteError('');
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Appearance Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon
                name={isDarkMode ? 'weather-night' : 'weather-sunny'}
                size={24}
                color={colors.primary}
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  {isDarkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              color={colors.primary}
            />
          </View>
        </Surface>

        {/* Data Management Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <View style={styles.dangerZone}>
            <View style={styles.dangerInfo}>
              <Icon name="alert-circle" size={24} color={colors.error} />
              <View style={styles.settingText}>
                <Text style={styles.dangerLabel}>Delete All Data</Text>
                <Text style={styles.settingDescription}>
                  Permanently remove all logs, symptoms, medications, and cycle data
                </Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => setDeleteModalVisible(true)}
              textColor={colors.error}
              style={styles.deleteButton}
              icon="delete"
            >
              Delete
            </Button>
          </View>
        </Surface>

        {/* App Info Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Name</Text>
            <Text style={styles.aboutValue}>Peri Tracker</Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <Surface style={styles.modalContent} elevation={5}>
              <View style={styles.modalHeader}>
                <Icon name="alert-circle" size={48} color={colors.error} />
                <Text style={styles.modalTitle}>Delete All Data?</Text>
              </View>

              <Text style={styles.modalDescription}>
                This action cannot be undone. All your logs, symptoms, medications, and cycle data will be permanently deleted.
              </Text>

              <Text style={styles.modalInstruction}>
                To confirm, please type your first name below:
              </Text>

              <TextInput
                mode="outlined"
                value={confirmName}
                onChangeText={(text) => {
                  setConfirmName(text);
                  setDeleteError('');
                }}
                placeholder="Enter your first name"
                style={styles.confirmInput}
                autoCapitalize="words"
                error={!!deleteError}
              />

              {deleteError ? (
                <Text style={styles.errorText}>{deleteError}</Text>
              ) : null}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={handleCloseModal}
                  style={styles.modalButton}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleDeleteData}
                  style={[styles.modalButton, styles.confirmDeleteButton]}
                  buttonColor={colors.error}
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  Delete Everything
                </Button>
              </View>
            </Surface>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  aboutValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    backgroundColor: colors.surfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  modalInstruction: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  confirmInput: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceVariant,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  confirmDeleteButton: {
    flex: 1.5,
  },
});
